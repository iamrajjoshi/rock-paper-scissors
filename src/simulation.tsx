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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const objectsRef = useRef<SimObject[]>([]);

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 400;
  const OBJECT_RADIUS = 5;
  const SPEED = 2;

  const createObject = (type: ObjectType): SimObject => ({
    type,
    x: Math.random() * (CANVAS_WIDTH - 2 * OBJECT_RADIUS) + OBJECT_RADIUS,
    y: Math.random() * (CANVAS_HEIGHT - 2 * OBJECT_RADIUS) + OBJECT_RADIUS,
    dx: (Math.random() - 0.5) * SPEED,
    dy: (Math.random() - 0.5) * SPEED
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
    // Calculate bounce angles and velocities
    const angle = Math.atan2(obj2.y - obj1.y, obj2.x - obj1.x);
    const speed1 = Math.sqrt(obj1.dx * obj1.dx + obj1.dy * obj1.dy);
    const speed2 = Math.sqrt(obj2.dx * obj2.dx + obj2.dy * obj2.dy);
    
    obj1.dx = -Math.cos(angle) * speed1;
    obj1.dy = -Math.sin(angle) * speed1;
    obj2.dx = Math.cos(angle) * speed2;
    obj2.dy = Math.sin(angle) * speed2;

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
    setCounts(initialCounts);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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
    <div className="p-4 flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-300 rounded-lg shadow-md mb-8"
      />

      <div className="w-full max-w-[600px]">
        <div className="space-x-4 mb-6 flex justify-center">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition-colors"
          >
            Start
          </button>
          <button
            onClick={handleStop}
            disabled={!isRunning}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50 hover:bg-red-600 transition-colors"
          >
            Stop
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="space-y-4">
          {(Object.keys(counts) as ObjectType[]).map(type => (
            <div key={type} className="flex items-center space-x-4">
              <label className="w-20 capitalize font-medium text-gray-700">{type}:</label>
              <input
                type="range"
                min="0"
                max="50"
                value={counts[type]}
                onChange={(e) => setCounts(prev => ({
                  ...prev,
                  [type]: parseInt(e.target.value)
                }))}
                className="w-48 accent-blue-500"
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
                }}
                className="w-16 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Simulation;