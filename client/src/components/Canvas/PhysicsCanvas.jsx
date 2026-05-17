import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import Matter from 'matter-js'

const {
  Engine, Render, Runner, World, Bodies, Body, Mouse, MouseConstraint,
  Events, Composite, Constraint, Vector
} = Matter

// Color palette for new bodies
const BODY_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#f43f5e', '#ec4899', '#14b8a6', '#3b82f6', '#a855f7',
]

let colorIndex = 0
const getNextColor = () => {
  const color = BODY_COLORS[colorIndex % BODY_COLORS.length]
  colorIndex++
  return color
}

const distSq = (p, v, w) => {
  const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
  if (l2 === 0) return Math.pow(p.x - v.x, 2) + Math.pow(p.y - v.y, 2);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.pow(p.x - (v.x + t * (w.x - v.x)), 2) + Math.pow(p.y - (v.y + t * (w.y - v.y)), 2);
}

const PhysicsCanvas = forwardRef(({ selectedTool, onBodySelect, isPlaying, onEngineReady, multiplayer }, ref) => {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const renderRef = useRef(null)
  const runnerRef = useRef(null)
  const mouseConstraintRef = useRef(null)
  const constraintStartRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [actionHistory, setActionHistory] = useState([])
  const [redoStack, setRedoStack] = useState([])

  useImperativeHandle(ref, () => ({
    undo: () => {
      const engine = engineRef.current
      if (!engine || actionHistory.length === 0) return
      const historyCopy = [...actionHistory]
      const lastAction = historyCopy.pop()
      setActionHistory(historyCopy)
      
      const target = lastAction.type === 'body' 
        ? Composite.allBodies(engine.world).find(b => b.id === lastAction.id)
        : Composite.allConstraints(engine.world).find(c => c.id === lastAction.id)
      
      if (target) {
        if (target._motorHandler) Events.off(engine, 'beforeUpdate', target._motorHandler)
        if (lastAction.type === 'constraint' && target.bodyA && target.bodyA._motorHandler) {
          Events.off(engine, 'beforeUpdate', target.bodyA._motorHandler)
          delete target.bodyA._motorHandler
          target.bodyA.label = target.bodyA.label.replace(' [Motor]', '')
        } else if (lastAction.type === 'constraint' && target.bodyB && target.bodyB._motorHandler) {
          Events.off(engine, 'beforeUpdate', target.bodyB._motorHandler)
          delete target.bodyB._motorHandler
          target.bodyB.label = target.bodyB.label.replace(' [Motor]', '')
        }
        
        Composite.remove(engine.world, target)
        setRedoStack(prev => [...prev, { ...lastAction, removedObj: target }])
        if (lastAction.type === 'body' && multiplayer?.sendBodyRemoved) multiplayer.sendBodyRemoved(target.id)
      }
    },
    redo: () => {
      const engine = engineRef.current
      if (!engine || redoStack.length === 0) return
      const redoCopy = [...redoStack]
      const nextAction = redoCopy.pop()
      setRedoStack(redoCopy)

      if (nextAction.removedObj) {
        Composite.add(engine.world, nextAction.removedObj)
        if (nextAction.removedObj._motorHandler) {
          Events.on(engine, 'beforeUpdate', nextAction.removedObj._motorHandler)
        }
        setActionHistory(prev => [...prev, nextAction])

        if (nextAction.type === 'body' && multiplayer?.sendBodyCreated) {
           // Basic sync, ideal syncing would reuse full object payload
           multiplayer.sendBodyCreated({ remoteId: nextAction.removedObj.id, shape: 'circle', x: nextAction.removedObj.position.x, y: nextAction.removedObj.position.y })
        }
      }
    },
    clearAll: () => {
      const engine = engineRef.current
      if (!engine) return
      const bodies = Composite.allBodies(engine.world)
      bodies.forEach(b => {
        if (!b.isStatic) {
          if (b._motorHandler) Events.off(engine, 'beforeUpdate', b._motorHandler)
          Composite.remove(engine.world, b)
          if (multiplayer?.sendBodyRemoved) multiplayer.sendBodyRemoved(b.id)
        }
      })
      const constraints = Composite.allConstraints(engine.world)
      constraints.forEach(c => {
        if (c.label !== 'Mouse Constraint') Composite.remove(engine.world, c)
      })
      setActionHistory([])
      setRedoStack([])
    },
    getSnapshot: () => {
      const engine = engineRef.current
      if (!engine) return null
      
      const bodies = Composite.allBodies(engine.world)
        .filter(b => (!b.isStatic || b.label === 'Platform' || b.label === 'Wall'))
        .map(b => ({
          id: b.id, // Keep ID for constraint matching
          x: b.position.x, y: b.position.y, angle: b.angle,
          velocity: { x: b.velocity.x, y: b.velocity.y },
          angularVelocity: b.angularVelocity,
          isStatic: b.isStatic, label: b.label,
          customParams: b.customParams || null,
          color: b.render?.fillStyle,
          mass: b.mass,
          density: b.density,
          friction: b.friction,
          restitution: b.restitution,
          frictionAir: b.frictionAir,
          _hasMotor: !!b._motorHandler // Flag for motor re-creation
        }))
        
      const constraints = Composite.allConstraints(engine.world)
        .filter(c => c.label !== 'Mouse Constraint')
        .map(c => ({
          bodyA_id: c.bodyA ? c.bodyA.id : null,
          bodyB_id: c.bodyB ? c.bodyB.id : null,
          pointA: c.pointA ? { x: c.pointA.x, y: c.pointA.y } : null,
          pointB: c.pointB ? { x: c.pointB.x, y: c.pointB.y } : null,
          length: c.length,
          stiffness: c.stiffness,
          damping: c.damping,
          render: c.render
        }))
        
      return { bodies, constraints }
    },
    loadSnapshot: (snapshot) => {
      const engine = engineRef.current
      if (!engine || !snapshot || !snapshot.bodies) return
      
      // Clear all existing non-static bodies & constraints
      Composite.allBodies(engine.world).forEach(b => {
        if (!b.isStatic) {
          if (b._motorHandler) Events.off(engine, 'beforeUpdate', b._motorHandler)
          Composite.remove(engine.world, b)
        }
      })
      Composite.allConstraints(engine.world).forEach(c => {
        if (c.label !== 'Mouse Constraint') Composite.remove(engine.world, c)
      })
      
      // Map old IDs to new Bodies
      const idMap = new Map();

      snapshot.bodies.forEach(bData => {
        if (bData.isStatic && (bData.label === 'Platform' || bData.label === 'Wall')) {
          // Check if it already exists by looking for close coordinates and label
          const existing = Composite.allBodies(engine.world).find(b => b.label === bData.label && Math.abs(b.position.x - bData.x) < 5 && Math.abs(b.position.y - bData.y) < 5);
          if (existing) {
             idMap.set(bData.id, existing);
             return;
          }
          
          let w = bData.label === 'Platform' ? 200 : 20;
          let h = bData.label === 'Platform' ? 20 : 150;
          const body = Bodies.rectangle(bData.x, bData.y, w, h, {
            isStatic: true, render: { fillStyle: '#334155', strokeStyle: '#475569', lineWidth: 2 },
            label: bData.label
          });
          Body.setAngle(body, bData.angle || 0);
          Composite.add(engine.world, body);
          idMap.set(bData.id, body);
          return;
        }

        if (bData.customParams) {
          let body = null;
          const { shape, radius, width, height, sides, color, restitution, friction, opacity, hasGlow } = bData.customParams;
          const renderOpts = { fillStyle: color, lineWidth: hasGlow ? 3 : 1, strokeStyle: hasGlow ? color : 'rgba(255,255,255,0.1)', opacity: opacity ?? 1 };

          if (shape === 'circle') {
            body = Bodies.circle(bData.x, bData.y, radius, { render: renderOpts, restitution: bData.restitution ?? restitution, friction: bData.friction ?? friction });
          } else if (shape === 'rectangle') {
            body = Bodies.rectangle(bData.x, bData.y, width, height, { render: renderOpts, restitution: bData.restitution ?? restitution, friction: bData.friction ?? friction });
          } else if (shape === 'polygon') {
            body = Bodies.polygon(bData.x, bData.y, sides, radius, { render: renderOpts, restitution: bData.restitution ?? restitution, friction: bData.friction ?? friction });
          } else if (shape === 'wedge') {
            const w = bData.customParams.width || 100;
            const h = w * Math.tan((bData.customParams.wedgeAngle || 30) * Math.PI / 180);
            body = Bodies.fromVertices(bData.x, bData.y, [[{x:0, y:0}, {x:w, y:0}, {x:0, y:-h}]], { isStatic: true, render: renderOpts, restitution: bData.restitution ?? restitution, friction: bData.friction ?? friction });
          }
          
          if (body) {
            Body.setAngle(body, bData.angle || 0);
            if (bData.velocity) Body.setVelocity(body, bData.velocity);
            if (bData.angularVelocity) Body.setAngularVelocity(body, bData.angularVelocity);
            if (bData.mass) Body.setMass(body, bData.mass);
            if (bData.density) Body.setDensity(body, bData.density);
            if (bData.frictionAir) body.frictionAir = bData.frictionAir;
            if (bData.isStatic) Body.setStatic(body, true);
            body.label = bData.label || body.label;
            
            body.customParams = bData.customParams;
            Composite.add(engine.world, body);
            idMap.set(bData.id, body);
            
            if (bData._hasMotor) {
              const motorSpeed = 0.05;
              const motorHandler = () => Body.setAngularVelocity(body, motorSpeed);
              Events.on(engine, 'beforeUpdate', motorHandler);
              body._motorHandler = motorHandler;
            }
          }
        }
      });
      
      // Recreate constraints
      if (snapshot.constraints) {
        snapshot.constraints.forEach(cData => {
           let options = {
             length: cData.length,
             stiffness: cData.stiffness,
             damping: cData.damping,
             render: cData.render
           };
           if (cData.bodyA_id && idMap.has(cData.bodyA_id)) options.bodyA = idMap.get(cData.bodyA_id);
           if (cData.bodyB_id && idMap.has(cData.bodyB_id)) options.bodyB = idMap.get(cData.bodyB_id);
           if (cData.pointA) options.pointA = cData.pointA;
           if (cData.pointB) options.pointB = cData.pointB;
           
           if (options.bodyA || options.bodyB) {
              Composite.add(engine.world, Constraint.create(options));
           }
        });
      }
      
      
      setActionHistory([])
      setRedoStack([])
    },
    updateBody: (id, updates) => {
      const engine = engineRef.current;
      if (!engine) return;
      const bodies = Composite.allBodies(engine.world);
      const target = bodies.find(b => b.id === id);
      if (!target) return;

      const needsRecreation = ['width', 'height', 'radius', 'sides', 'wedgeAngle'].some(key => key in updates);
      
      if (needsRecreation && target.customParams) {
        // Recreate body to correctly resize
        const { x, y } = target.position;
        const angle = target.angle;
        const velocity = { x: target.velocity.x, y: target.velocity.y };
        const angularVelocity = target.angularVelocity;
        const customParams = { ...target.customParams, ...updates };

        let newBody = null;
        const { shape, radius, width, height, sides, color, restitution, friction, opacity, hasGlow } = customParams;
        const renderOpts = { fillStyle: color, lineWidth: hasGlow ? 3 : 1, strokeStyle: hasGlow ? color : 'rgba(255,255,255,0.1)', opacity: opacity ?? target.render.opacity };

        if (shape === 'circle') {
          newBody = Bodies.circle(x, y, radius, { render: renderOpts, restitution, friction });
        } else if (shape === 'rectangle') {
          newBody = Bodies.rectangle(x, y, width, height, { render: renderOpts, restitution, friction });
        } else if (shape === 'polygon') {
          newBody = Bodies.polygon(x, y, sides, radius, { render: renderOpts, restitution, friction });
        } else if (shape === 'wedge') {
          const w = customParams.width || 100;
          const h = w * Math.tan((customParams.wedgeAngle || 30) * Math.PI / 180);
          newBody = Bodies.fromVertices(x, y, [[{x:0, y:0}, {x:w, y:0}, {x:0, y:-h}]], { isStatic: true, render: renderOpts, restitution, friction });
        }

        if (newBody) {
          newBody.customParams = customParams;
          Body.setAngle(newBody, angle);
          Body.setVelocity(newBody, velocity);
          Body.setAngularVelocity(newBody, angularVelocity);
          Body.setMass(newBody, target.mass);
          Body.setDensity(newBody, target.density);
          newBody.frictionAir = target.frictionAir;
          Body.setStatic(newBody, target.isStatic);
          
          if (target._remoteId) newBody._remoteId = target._remoteId;
          
          if (target._motorHandler) {
             newBody._motorHandler = target._motorHandler;
             newBody.label = target.label;
          }

          // Move constraints to new body
          const constraints = Composite.allConstraints(engine.world);
          constraints.forEach(c => {
            if (c.bodyA === target) c.bodyA = newBody;
            if (c.bodyB === target) c.bodyB = newBody;
          });

          Composite.remove(engine.world, target);
          Composite.add(engine.world, newBody);
          onBodySelect(newBody); // update selection

          if (multiplayer?.sendBodyRemoved) multiplayer.sendBodyRemoved(target.id);
          if (multiplayer?.sendBodyCreated) multiplayer.sendBodyCreated({ ...customParams, remoteId: newBody.id, x, y });
        }
      } else {
        // Direct mutation
        if ('mass' in updates) Body.setMass(target, updates.mass);
        if ('density' in updates) Body.setDensity(target, updates.density);
        if ('friction' in updates) target.friction = updates.friction;
        if ('restitution' in updates) target.restitution = updates.restitution;
        if ('frictionAir' in updates) target.frictionAir = updates.frictionAir;
        if ('isStatic' in updates) Body.setStatic(target, updates.isStatic);
        if ('angle' in updates) Body.setAngle(target, updates.angle);
        if ('angularVelocity' in updates) Body.setAngularVelocity(target, updates.angularVelocity);
        if ('velocityX' in updates || 'velocityY' in updates) {
          Body.setVelocity(target, { 
            x: updates.velocityX ?? target.velocity.x, 
            y: updates.velocityY ?? target.velocity.y 
          });
        }
        
        // Broadcast direct property changes to others
        if (multiplayer?.sendBodyUpdated) {
           multiplayer.sendBodyUpdated(target._remoteId || target.id, updates);
        }
        
        // Visuals
        if (target.customParams) {
          if ('color' in updates) {
            target.render.fillStyle = updates.color;
            if (target.customParams.hasGlow) target.render.strokeStyle = updates.color;
          }
          if ('opacity' in updates) target.render.opacity = updates.opacity;
          if ('hasGlow' in updates) {
            target.render.lineWidth = updates.hasGlow ? 3 : 1;
            target.render.strokeStyle = updates.hasGlow ? target.render.fillStyle : 'rgba(255,255,255,0.1)';
          }
          target.customParams = { ...target.customParams, ...updates };
        }
      }
    }
  }))

  // Initialize Matter.js
  useEffect(() => {
    const container = canvasRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight
    setCanvasSize({ width, height })

    // Create engine
    const engine = Engine.create({
      gravity: { x: 0, y: 1 },
    })
    engineRef.current = engine
    onEngineReady(engine)

    // Create renderer
    const render = Render.create({
      element: container,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio || 1,
        showVelocity: false,
        showAngleIndicator: false,
      },
    })
    renderRef.current = render

    // Create runner
    const runner = Runner.create()
    runnerRef.current = runner

    // Mouse interaction
    const mouse = Mouse.create(render.canvas)
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: true,
          lineWidth: 1,
          strokeStyle: 'rgba(99, 102, 241, 0.5)',
        },
      },
    })
    mouseConstraintRef.current = mouseConstraint
    Composite.add(engine.world, mouseConstraint)

    // Keep the mouse in sync with rendering
    render.mouse = mouse

    // Add default ground
    const ground = Bodies.rectangle(width / 2, height - 20, width, 40, {
      isStatic: true,
      render: {
        fillStyle: '#1e293b',
        strokeStyle: '#334155',
        lineWidth: 2,
      },
      label: 'Ground',
    })

    // Side walls
    const leftWall = Bodies.rectangle(-10, height / 2, 20, height, {
      isStatic: true,
      render: { fillStyle: '#1e293b', strokeStyle: '#334155', lineWidth: 1 },
      label: 'Left Wall',
    })
    const rightWall = Bodies.rectangle(width + 10, height / 2, 20, height, {
      isStatic: true,
      render: { fillStyle: '#1e293b', strokeStyle: '#334155', lineWidth: 1 },
      label: 'Right Wall',
    })

    Composite.add(engine.world, [ground, leftWall, rightWall])

    // Start renderer
    Render.run(render)

    // Render Gizmos for selection (Optional, can be removed since we use strokeStyle)
    Events.on(render, 'afterRender', () => {
      const context = render.context;
      const engine = engineRef.current;
      if (!engine || !engine.world) return;
      
      const bodies = Composite.allBodies(engine.world);
      bodies.forEach(b => {
        if (b._wasSelected) {
           context.beginPath();
           context.arc(b.position.x, b.position.y, 4, 0, 2 * Math.PI);
           context.fillStyle = '#fff';
           context.fill();
        }
      });
    });

    // Broadcast position when dragging
    Events.on(engine, 'afterUpdate', () => {
      if (mouseConstraintRef.current && mouseConstraintRef.current.body) {
         const b = mouseConstraintRef.current.body;
         // Send dragging updates to others
         if (multiplayer?.sendBodyUpdated) {
            multiplayer.sendBodyUpdated(b._remoteId || b.id, {
               x: b.position.x,
               y: b.position.y,
               vx: b.velocity.x,
               vy: b.velocity.y,
               angle: b.angle,
               angularVelocity: b.angularVelocity
            });
         }
      }
    });

    // Body selection on click
    Events.on(mouseConstraint, 'mousedown', (event) => {
      const bodies = Composite.allBodies(engine.world)
      const mousePos = event.mouse.position
      const clickedBodies = Matter.Query.point(bodies, mousePos)

      if (clickedBodies.length > 0) {
        const body = clickedBodies[0]
        if (!body.isStatic || body.label !== 'Ground') {
          bodies.forEach(b => {
             if (b._wasSelected) {
                b.render.lineWidth = b.customParams?.hasGlow ? 3 : 1;
                b.render.strokeStyle = b.customParams?.hasGlow ? b.render.fillStyle : 'rgba(255,255,255,0.1)';
                b._wasSelected = false;
             }
          });
          body._wasSelected = true;
          body.render.lineWidth = 4;
          body.render.strokeStyle = '#a855f7'; // Purple glow
          onBodySelect(body)
        }
      } else {
          bodies.forEach(b => {
             if (b._wasSelected) {
                b.render.lineWidth = b.customParams?.hasGlow ? 3 : 1;
                b.render.strokeStyle = b.customParams?.hasGlow ? b.render.fillStyle : 'rgba(255,255,255,0.1)';
                b._wasSelected = false;
             }
          });
          onBodySelect(null);
      }
    })

    // Handle resize
    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      setCanvasSize({ width: w, height: h })
      render.canvas.width = w * (window.devicePixelRatio || 1)
      render.canvas.height = h * (window.devicePixelRatio || 1)
      render.options.width = w
      render.options.height = h
      Render.setPixelRatio(render, window.devicePixelRatio || 1)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    // Grid background for canvas
    const canvas = render.canvas
    canvas.style.background = `
      radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.03) 0%, transparent 70%),
      linear-gradient(rgba(51, 65, 85, 0.15) 1px, transparent 1px),
      linear-gradient(90deg, rgba(51, 65, 85, 0.15) 1px, transparent 1px)
    `
    canvas.style.backgroundSize = '100% 100%, 40px 40px, 40px 40px'

    return () => {
      resizeObserver.disconnect()
      Render.stop(render)
      Runner.stop(runner)
      Engine.clear(engine)
      render.canvas.remove()
      render.textures = {}
    }
  }, [])

  // Setup multiplayer event handlers
  useEffect(() => {
    if (!multiplayer || !engineRef.current) return

    multiplayer.setHandlers({
      onBodyAdded: (bodyData) => {
        const engine = engineRef.current
        if (!engine) return
        let body = null
        switch (bodyData.shape) {
          case 'circle':
            body = Bodies.circle(bodyData.x, bodyData.y, bodyData.radius || 30, {
              render: { fillStyle: bodyData.color || '#6366f1', strokeStyle: 'rgba(255,255,255,0.1)', lineWidth: 1 },
              restitution: bodyData.restitution || 0.5,
              friction: bodyData.friction || 0.1,
            })
            break
          case 'rectangle':
            body = Bodies.rectangle(bodyData.x, bodyData.y, bodyData.width || 50, bodyData.height || 40, {
              render: { fillStyle: bodyData.color || '#6366f1', strokeStyle: 'rgba(255,255,255,0.1)', lineWidth: 1 },
              restitution: bodyData.restitution || 0.3,
              friction: bodyData.friction || 0.1,
            })
            break
          case 'polygon':
            body = Bodies.polygon(bodyData.x, bodyData.y, bodyData.sides || 3, bodyData.radius || 30, {
              render: { fillStyle: bodyData.color || '#6366f1', strokeStyle: 'rgba(255,255,255,0.1)', lineWidth: 1 },
              restitution: bodyData.restitution || 0.4,
              friction: bodyData.friction || 0.1,
            })
            break
          case 'wedge': {
            const w = bodyData.width || 100;
            const h = w * Math.tan((bodyData.wedgeAngle || 30) * Math.PI / 180);
            body = Bodies.fromVertices(bodyData.x, bodyData.y, [[{x:0, y:0}, {x:w, y:0}, {x:0, y:-h}]], {
              isStatic: true,
              render: { fillStyle: bodyData.color || '#6366f1', strokeStyle: 'rgba(255,255,255,0.1)', lineWidth: 1 },
              restitution: bodyData.restitution || 0.1,
              friction: bodyData.friction || 0.5,
            })
            break
          }
          default:
            return
        }
        if (body) {
          body._remoteId = bodyData.remoteId
          Composite.add(engine.world, body)
        }
      },
      onBodyRemoved: (bodyId) => {
        const engine = engineRef.current
        if (!engine) return
        const bodies = Composite.allBodies(engine.world)
        const target = bodies.find(b => b.id === bodyId || b._remoteId === bodyId)
        if (target) Composite.remove(engine.world, target)
      },
      onPhysicsSync: (data) => {
        const engine = engineRef.current
        if (!engine || !data?.bodies) return
        const localBodies = Composite.allBodies(engine.world)
        
        const lerp = (a, b, t) => a + (b - a) * t;
        const factor = 0.5; // Smooth interpolation instead of hard snapping

        data.bodies.forEach(remote => {
          const local = localBodies.find(b => b.id === remote.id || b._remoteId === remote.id)
          if (local && !local.isStatic && !local.isSleeping) {
            // FIX: If the local user is currently dragging this body, ignore the host's physics sync
            // to prevent the object from stuttering/glitching up and down.
            if (mouseConstraintRef.current && mouseConstraintRef.current.body === local) {
              return;
            }
            
            // Apply smoothing lag compensation
            Body.setPosition(local, { 
              x: lerp(local.position.x, remote.x, factor), 
              y: lerp(local.position.y, remote.y, factor) 
            })
            Body.setVelocity(local, { 
              x: lerp(local.velocity.x, remote.vx, factor), 
              y: lerp(local.velocity.y, remote.vy, factor) 
            })
            Body.setAngle(local, lerp(local.angle, remote.angle, factor))
            Body.setAngularVelocity(local, lerp(local.angularVelocity, remote.aVel, factor))
          }
        })
      },
      onBodyChanged: (data) => {
        const engine = engineRef.current
        if (!engine || !data.updates) return
        const localBodies = Composite.allBodies(engine.world)
        const target = localBodies.find(b => b.id === data.bodyId || b._remoteId === data.bodyId)
        if (target) {
           if ('mass' in data.updates) Body.setMass(target, data.updates.mass);
           if ('density' in data.updates) Body.setDensity(target, data.updates.density);
           if ('friction' in data.updates) target.friction = data.updates.friction;
           if ('restitution' in data.updates) target.restitution = data.updates.restitution;
           if ('frictionAir' in data.updates) target.frictionAir = data.updates.frictionAir;
           if ('isStatic' in data.updates) Body.setStatic(target, data.updates.isStatic);
           if ('angle' in data.updates) Body.setAngle(target, data.updates.angle);
           if ('angularVelocity' in data.updates) Body.setAngularVelocity(target, data.updates.angularVelocity);
           
           if ('x' in data.updates && 'y' in data.updates) {
             Body.setPosition(target, { x: data.updates.x, y: data.updates.y });
           }
           if ('vx' in data.updates && 'vy' in data.updates) {
             Body.setVelocity(target, { x: data.updates.vx, y: data.updates.vy });
           }
           
           if (target.customParams) {
             if ('color' in data.updates) {
               target.render.fillStyle = data.updates.color;
               if (target.customParams.hasGlow) target.render.strokeStyle = data.updates.color;
             }
             if ('opacity' in data.updates) target.render.opacity = data.updates.opacity;
             if ('hasGlow' in data.updates) {
               target.render.lineWidth = data.updates.hasGlow ? 3 : 1;
               target.render.strokeStyle = data.updates.hasGlow ? target.render.fillStyle : 'rgba(255,255,255,0.1)';
             }
             target.customParams = { ...target.customParams, ...data.updates };
           }
        }
      },
    })
  }, [multiplayer])

  // Handle play/pause
  useEffect(() => {
    if (!runnerRef.current || !engineRef.current) return

    if (isPlaying) {
      Runner.run(runnerRef.current, engineRef.current)
    } else {
      Runner.stop(runnerRef.current)
    }
  }, [isPlaying])

  // Phase 5: Physics state broadcast (host sends snapshots)
  useEffect(() => {
    if (!multiplayer || !engineRef.current || !isPlaying) return
    if (!multiplayer.isHost || !multiplayer.roomCode) return

    const interval = setInterval(() => {
      const engine = engineRef.current
      if (!engine) return

      const bodies = Composite.allBodies(engine.world)
      const snapshot = bodies
        .filter(b => !b.isStatic)
        .map(b => ({
          id: b.id,
          x: b.position.x,
          y: b.position.y,
          vx: b.velocity.x,
          vy: b.velocity.y,
          angle: b.angle,
          aVel: b.angularVelocity,
        }))

      multiplayer.sendPhysicsUpdate({ bodies: snapshot, timestamp: Date.now() })
    }, 100)

    return () => clearInterval(interval)
  }, [multiplayer, isPlaying])

  const addShapeAt = useCallback((type, x, y) => {
    const engine = engineRef.current
    if (!engine) return
    const color = getNextColor()
    let body = null

    switch (type) {
      case 'circle': {
        const radius = 25 + Math.random() * 15;
        body = Bodies.circle(x, y, radius, {
          render: {
            fillStyle: color,
            strokeStyle: 'rgba(255,255,255,0.1)',
            lineWidth: 1,
          },
          restitution: 0.5,
          friction: 0.1,
        })
        body.customParams = { shape: 'circle', radius, color, restitution: 0.5, friction: 0.1 }
        break
      }
      case 'rectangle': {
        const width = 50 + Math.random() * 30;
        const height = 40 + Math.random() * 20;
        body = Bodies.rectangle(x, y, width, height, {
          render: {
            fillStyle: color,
            strokeStyle: 'rgba(255,255,255,0.1)',
            lineWidth: 1,
          },
          restitution: 0.3,
          friction: 0.1,
        })
        body.customParams = { shape: 'rectangle', width, height, color, restitution: 0.3, friction: 0.1 }
        break
      }
      case 'triangle': {
        const radius = 30 + Math.random() * 10;
        body = Bodies.polygon(x, y, 3, radius, {
          render: {
            fillStyle: color,
            strokeStyle: 'rgba(255,255,255,0.1)',
            lineWidth: 1,
          },
          restitution: 0.4,
          friction: 0.1,
        })
        body.customParams = { shape: 'polygon', sides: 3, radius, color, restitution: 0.4, friction: 0.1 }
        break
      }
      case 'wedge': {
        const width = 150;
        const wedgeAngle = 30; // degrees
        const height = width * Math.tan(wedgeAngle * Math.PI / 180);
        const vertices = [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: 0, y: -height }
        ];
        body = Bodies.fromVertices(x, y, [vertices], {
          isStatic: true,
          render: { fillStyle: color, strokeStyle: 'rgba(255,255,255,0.1)', lineWidth: 1 },
          restitution: 0.1,
          friction: 0.5,
          label: 'Wedge'
        });
        body.customParams = { shape: 'wedge', width, wedgeAngle, color, restitution: 0.1, friction: 0.5 };
        break
      }
      case 'ground':
        body = Bodies.rectangle(x, y, 200, 20, {
          isStatic: true,
          render: {
            fillStyle: '#334155',
            strokeStyle: '#475569',
            lineWidth: 2,
          },
          label: 'Platform',
        })
        break
      case 'wall':
        body = Bodies.rectangle(x, y, 20, 150, {
          isStatic: true,
          render: {
            fillStyle: '#334155',
            strokeStyle: '#475569',
            lineWidth: 2,
          },
          label: 'Wall',
        })
        break
      default:
        return
    }

    if (body) {
      Composite.add(engine.world, body)
      setActionHistory(prev => [...prev, { type: 'body', id: body.id }])
      setRedoStack([])
      onBodySelect(body)

      if (multiplayer?.sendBodyCreated) {
        const bodyData = {
          remoteId: body.id,
          shape: type === 'circle' ? 'circle' : type === 'rectangle' ? 'rectangle' : type === 'wedge' ? 'wedge' : 'polygon',
          x: body.position.x,
          y: body.position.y,
          color: body.render.fillStyle,
          restitution: body.restitution,
          friction: body.friction,
        }
        if (type === 'circle') bodyData.radius = body.circleRadius
        else if (type === 'rectangle') {
          bodyData.width = body.bounds.max.x - body.bounds.min.x
          bodyData.height = body.bounds.max.y - body.bounds.min.y
        } else if (type === 'wedge') {
          bodyData.width = body.customParams.width
          bodyData.wedgeAngle = body.customParams.wedgeAngle
        } else {
          bodyData.sides = body.vertices.length
          bodyData.radius = 30
        }
        multiplayer.sendBodyCreated(bodyData)
      }
    }
  }, [onBodySelect, multiplayer])

  // Handle canvas click to add shapes or tools
  const handleCanvasClick = useCallback((e) => {
    if (!engineRef.current) return

    // Only process clicks directly on the canvas element itself
    const canvasEl = canvasRef.current?.querySelector('canvas')
    if (!canvasEl || e.target !== canvasEl) return

    const rect = canvasEl.getBoundingClientRect()

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const engine = engineRef.current

    if (selectedTool === 'select') {
      const bodies = Composite.allBodies(engine.world)
      const clickedBodies = Matter.Query.point(bodies, { x, y })

      if (clickedBodies.length > 0) {
        const body = clickedBodies[0]
        if (!body.isStatic || body.label !== 'Ground') {
          bodies.forEach(b => {
             if (b._wasSelected) {
                b.render.lineWidth = b.customParams?.hasGlow ? 3 : 1;
                b.render.strokeStyle = b.customParams?.hasGlow ? b.render.fillStyle : 'rgba(255,255,255,0.1)';
                b._wasSelected = false;
             }
          });
          body._wasSelected = true;
          body.render.lineWidth = 4;
          body.render.strokeStyle = '#a855f7'; // Purple glow
          onBodySelect(body)
        }
      } else {
          bodies.forEach(b => {
             if (b._wasSelected) {
                b.render.lineWidth = b.customParams?.hasGlow ? 3 : 1;
                b.render.strokeStyle = b.customParams?.hasGlow ? b.render.fillStyle : 'rgba(255,255,255,0.1)';
                b._wasSelected = false;
             }
          });
          onBodySelect(null);
      }
      return
    }

    if (['circle', 'rectangle', 'triangle', 'wedge', 'ground', 'wall'].includes(selectedTool)) {
      addShapeAt(selectedTool, x, y)
      return
    }

    switch (selectedTool) {
      case 'delete': {
        const bodies = Composite.allBodies(engine.world)
        const clicked = Matter.Query.point(bodies, { x, y })
        if (clicked.length > 0 && !clicked[0].isStatic) {
          if (clicked[0]._motorHandler) Events.off(engine, 'beforeUpdate', clicked[0]._motorHandler)
          Composite.remove(engine.world, clicked[0])
          onBodySelect(null)
          if (multiplayer?.sendBodyRemoved) multiplayer.sendBodyRemoved(clicked[0].id)
        } else if (clicked.length === 0) {
          // Look for constraints to delete only if no body was clicked
          const constraints = Composite.allConstraints(engine.world)
          for (const c of constraints) {
            if (c.label === 'Mouse Constraint') continue
            const p = { x, y }
            const v = c.pointA ? { x: c.pointA.x + (c.bodyA ? c.bodyA.position.x : 0), y: c.pointA.y + (c.bodyA ? c.bodyA.position.y : 0) } : c.bodyA.position
            const w = c.pointB ? { x: c.pointB.x + (c.bodyB ? c.bodyB.position.x : 0), y: c.pointB.y + (c.bodyB ? c.bodyB.position.y : 0) } : c.bodyB.position
            if (distSq(p, v, w) < 400) { // < 20px radius
              Composite.remove(engine.world, c)
              break
            }
          }
        }
        return
      }

      case 'constraint':
      case 'spring':
      case 'pin': {
        const bodies = Composite.allBodies(engine.world)
        const clicked = Matter.Query.point(bodies, { x, y })

        if (clicked.length === 0) return

        if (!constraintStartRef.current) {
          // First click — store the body
          constraintStartRef.current = { body: clicked[0], point: { x, y } }
        } else {
          // Second click — create constraint
          const bodyA = constraintStartRef.current.body
          const bodyB = clicked[0]

          let constraintOptions = {
            bodyA,
            bodyB,
            render: {
              strokeStyle: 'rgba(99, 102, 241, 0.6)',
              lineWidth: 2,
            },
          }

          if (selectedTool === 'spring') {
            constraintOptions.stiffness = 0.05
            constraintOptions.damping = 0.01
            constraintOptions.render.strokeStyle = 'rgba(6, 182, 212, 0.6)'
            constraintOptions.render.type = 'spring'
          } else if (selectedTool === 'pin') {
            constraintOptions = {
              bodyA,
              pointA: { x: 0, y: 0 },
              pointB: { x: bodyA.position.x, y: bodyA.position.y },
              length: 0,
              stiffness: 1,
              render: {
                strokeStyle: 'rgba(245, 158, 11, 0.6)',
                lineWidth: 2,
              },
            }
            delete constraintOptions.bodyB
          } else {
            constraintOptions.stiffness = 0.8
          }

          const constraint = Constraint.create(constraintOptions)
          Composite.add(engine.world, constraint)
          setActionHistory(prev => [...prev, { type: 'constraint', id: constraint.id }])
          setRedoStack([])
          constraintStartRef.current = null
        }
        return
      }

      case 'motor': {
        const bodies = Composite.allBodies(engine.world)
        const clicked = Matter.Query.point(bodies, { x, y })
        if (clicked.length === 0 || clicked[0].isStatic) return

        const target = clicked[0]

        // Pin the body at its center to the world
        const motorPin = Constraint.create({
          pointA: { x: target.position.x, y: target.position.y },
          bodyB: target,
          pointB: { x: 0, y: 0 },
          length: 0,
          stiffness: 1,
          render: {
            strokeStyle: 'rgba(236, 72, 153, 0.8)',
            lineWidth: 3,
          },
        })
        Composite.add(engine.world, motorPin)

        // Apply continuous angular velocity via beforeUpdate
        const motorSpeed = 0.05
        const motorHandler = () => {
          Body.setAngularVelocity(target, motorSpeed)
        }
        Events.on(engine, 'beforeUpdate', motorHandler)

        // Store handler reference on body for potential cleanup
        target._motorHandler = motorHandler
        target.label = (target.label || '') + ' [Motor]'

        setActionHistory(prev => [...prev, { type: 'constraint', id: motorPin.id }])
        setRedoStack([])

        return
      }

      default:
        return
    }
  }, [selectedTool, onBodySelect, multiplayer, addShapeAt])

  // Cursor style based on tool
  const getCursorStyle = () => {
    switch (selectedTool) {
      case 'select': return 'default'
      case 'delete': return 'not-allowed'
      case 'constraint':
      case 'spring':
      case 'pin':
        return constraintStartRef.current ? 'crosshair' : 'pointer'
      default: return 'crosshair'
    }
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const toolId = e.dataTransfer.getData('shapeType')
    if (!toolId) return

    const canvasEl = canvasRef.current?.querySelector('canvas') || canvasRef.current
    const rect = canvasEl.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    addShapeAt(toolId, x, y)
  }, [addShapeAt])

  return (
    <div
      ref={canvasRef}
      className="w-full h-full relative"
      style={{ cursor: getCursorStyle() }}
      onClick={handleCanvasClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.04) 0%, transparent 70%),
          linear-gradient(rgba(51, 65, 85, 0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(51, 65, 85, 0.12) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 40px 40px, 40px 40px',
      }} />

      {/* Coordinate display */}
      <div className="absolute top-3 right-3 z-20">
        <div className="glass-panel-light px-3 py-1.5 flex items-center gap-3">
          <span className="text-[10px] font-mono text-surface-400">
            Bodies: {engineRef.current ? Composite.allBodies(engineRef.current.world).length : 0}
          </span>
        </div>
      </div>

      {/* Constraint mode indicator */}
      {constraintStartRef.current && (
        <div className="absolute top-3 left-3 z-20">
          <div className="glass-panel-light px-3 py-1.5 flex items-center gap-2 border-primary-500/30">
            <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse-soft" />
            <span className="text-[10px] font-medium text-primary-300">Click second body to connect</span>
          </div>
        </div>
      )}
    </div>
  )
})

PhysicsCanvas.displayName = 'PhysicsCanvas'
export default PhysicsCanvas
