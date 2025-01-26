type ObjectType = 'rock' | 'paper' | 'scissors';

interface SimObject {
  type: ObjectType;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Counts {
  [key: string]: number;
  rock: number;
  paper: number;
  scissors: number;
}

import { useState, useEffect, useRef, useCallback } from 'react';

const Simulation = () => {
  const initialCounts: Counts = { rock: 10, paper: 10, scissors: 10 };
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [speed, setSpeed] = useState<number>(2.5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const objectsRef = useRef<SimObject[]>([]);

  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 800;
  const OBJECT_RADIUS = 5;

  const createObject = (type: ObjectType): SimObject => ({
    type,
    x: Math.random() * (CANVAS_WIDTH - 2 * OBJECT_RADIUS) + OBJECT_RADIUS,
    y: Math.random() * (CANVAS_HEIGHT - 2 * OBJECT_RADIUS) + OBJECT_RADIUS,
    dx: (Math.random() - 0.5) * speed,
    dy: (Math.random() - 0.5) * speed
  });

  const initializeObjects = (): void => {
    const objects: SimObject[] = [];
    (Object.keys(counts) as ObjectType[]).forEach(type => {
      for (let i = 0; i < counts[type]; i++) {
        objects.push(createObject(type));
      }
    });
    objectsRef.current = objects;
  };

  const handleCollision = (obj1: SimObject, obj2: SimObject): void => {
    // Calculate normal vector of collision
    const nx = obj2.x - obj1.x;
    const ny = obj2.y - obj1.y;
    const dist = Math.sqrt(nx * nx + ny * ny);
    
    // Normalize the normal vector
    const unx = nx / dist;
    const uny = ny / dist;
    
    // Calculate tangent vector (perpendicular to normal)
    const utx = -uny;
    const uty = unx;
    
    // Project velocities onto normal and tangent vectors
    const v1n = obj1.dx * unx + obj1.dy * uny;
    const v1t = obj1.dx * utx + obj1.dy * uty;
    const v2n = obj2.dx * unx + obj2.dy * uny;
    const v2t = obj2.dx * utx + obj2.dy * uty;
    
    // Calculate new normal velocities (elastic collision)
    const v1nAfter = v2n;
    const v2nAfter = v1n;
    
    // Convert scalar velocities back to vectors
    obj1.dx = v1nAfter * unx + v1t * utx;
    obj1.dy = v1nAfter * uny + v1t * uty;
    obj2.dx = v2nAfter * unx + v2t * utx;
    obj2.dy = v2nAfter * uny + v2t * uty;

    // Handle type changes after bounce
    const beats: Record<ObjectType, ObjectType> = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper'
    };

    if (beats[obj1.type] === obj2.type) {
      obj2.type = obj1.type;
    } else if (beats[obj2.type] === obj1.type) {
      obj1.type = obj2.type;
    }
  };

  const updatePositions = useCallback((): void => {
    const objects = objectsRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    objects.forEach(obj => {
      obj.x += obj.dx;
      obj.y += obj.dy;

      // Bounce off walls
      if (obj.x <= OBJECT_RADIUS || obj.x >= CANVAS_WIDTH - OBJECT_RADIUS) {
        obj.dx *= -1;
      }
      if (obj.y <= OBJECT_RADIUS || obj.y >= CANVAS_HEIGHT - OBJECT_RADIUS) {
        obj.dy *= -1;
      }

      // Check collisions
      objects.forEach(other => {
        if (other !== obj) {
          const dx = other.x - obj.x;
          const dy = other.y - obj.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < OBJECT_RADIUS * 2) {
            handleCollision(obj, other);
          }
        }
      });
    });

    // Draw
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const emojis: Record<ObjectType, string> = {
      rock: '🪨',
      paper: '📄',
      scissors: '✂️'
    };

    objects.forEach(obj => {
      ctx.font = `${OBJECT_RADIUS * 2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emojis[obj.type], obj.x, obj.y);
    });

    if (isRunning) {
      animationRef.current = requestAnimationFrame(updatePositions);
    }
  }, [isRunning]);

  const handleStart = (): void => {
    if (!isRunning) {
      initializeObjects();
      setIsRunning(true);
    }
  };

  const handleStop = (): void => {
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleReset = (): void => {
    handleStop();
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  };

  const updateObjectCount = (type: ObjectType, newCount: number): void => {
    const currentObjects = objectsRef.current;
    const currentTypeCount = currentObjects.filter(obj => obj.type === type).length;
    
    if (newCount > currentTypeCount) {
      // Add new objects
      const objectsToAdd = newCount - currentTypeCount;
      for (let i = 0; i < objectsToAdd; i++) {
        currentObjects.push(createObject(type));
      }
    } else if (newCount < currentTypeCount) {
      // Remove random objects of the specified type
      const objectsToRemove = currentTypeCount - newCount;
      for (let i = 0; i < objectsToRemove; i++) {
        const typeObjects = currentObjects.filter(obj => obj.type === type);
        const randomIndex = Math.floor(Math.random() * typeObjects.length);
        const indexInMain = currentObjects.indexOf(typeObjects[randomIndex]);
        if (indexInMain !== -1) {
          currentObjects.splice(indexInMain, 1);
        }
      }
    }
  };

  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(updatePositions);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, updatePositions]);

  return (
    <div className="p-6 flex flex-col items-center bg-gray-50 min-h-screen">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-gray-200 rounded-xl shadow-lg mb-8 bg-white"
      />

      <div className="w-full max-w-[600px] bg-white rounded-xl shadow-md p-6">
        <div className="space-x-4 mb-8 flex justify-center">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors font-medium"
          >
            Start
          </button>
          <button
            onClick={handleStop}
            disabled={!isRunning}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg disabled:opacity-50 hover:bg-red-700 transition-colors font-medium"
          >
            Stop
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Reset
          </button>
        </div>

        <div className="mb-8">
          <div className="flex items-center space-x-6">
            <label className="w-24 font-semibold text-gray-700">Speed:</label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={speed}
              onChange={(e) => {
                const newSpeed = parseFloat(e.target.value);
                setSpeed(newSpeed);
                // Update existing objects' speeds
                if (isRunning) {
                  objectsRef.current.forEach(obj => {
                    const currentSpeed = Math.sqrt(obj.dx * obj.dx + obj.dy * obj.dy);
                    const scale = newSpeed / currentSpeed;
                    obj.dx *= scale;
                    obj.dy *= scale;
                  });
                }
              }}
              className="flex-1 h-2 accent-blue-600"
            />
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={speed}
              onChange={(e) => {
                const newSpeed = Math.min(10, Math.max(0.5, parseFloat(e.target.value) || 0.5));
                setSpeed(newSpeed);
                // Update existing objects' speeds
                if (isRunning) {
                  objectsRef.current.forEach(obj => {
                    const currentSpeed = Math.sqrt(obj.dx * obj.dx + obj.dy * obj.dy);
                    const scale = newSpeed / currentSpeed;
                    obj.dx *= scale;
                    obj.dy *= scale;
                  });
                }
              }}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
            />
          </div>
        </div>

        <div className="space-y-6">
          {(Object.keys(counts) as ObjectType[]).map(type => (
            <div key={type} className="flex items-center space-x-6">
              <label className="w-24 capitalize font-semibold text-gray-700">{type}:</label>
              <input
                type="range"
                min="0"
                max="50"
                value={counts[type]}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  setCounts(prev => ({
                    ...prev,
                    [type]: newValue
                  }));
                  if (isRunning) {
                    updateObjectCount(type, newValue);
                  }
                }}
                className="flex-1 h-2 accent-blue-600"
              />
              <input
                type="number"
                min="0"
                max="50"
                value={counts[type]}
                onChange={(e) => {
                  const value = Math.min(50, Math.max(0, parseInt(e.target.value) || 0));
                  setCounts(prev => ({
                    ...prev,
                    [type]: value
                  }));
                  if (isRunning) {
                    updateObjectCount(type, value);
                  }
                }}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Simulation;