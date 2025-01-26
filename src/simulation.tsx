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

import { useState, useEffect, useRef } from 'react';

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
    const beats: Record<ObjectType, ObjectType> = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper'
    };

    if (beats[obj1.type] === obj2.type) {
      obj2.type = obj1.type;
    }
  };

  const updatePositions = (): void => {
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

    const colors: Record<ObjectType, string> = {
      rock: '#ff4444',
      paper: '#44ff44',
      scissors: '#4444ff'
    };

    objects.forEach(obj => {
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, OBJECT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = colors[obj.type];
      ctx.fill();
    });

    if (isRunning) {
      animationRef.current = requestAnimationFrame(updatePositions);
    }
  };

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
  }, [isRunning]);

  return (
    <div className="p-4">
      <div className="mb-4 space-y-4">
        {(Object.keys(counts) as ObjectType[]).map(type => (
          <div key={type} className="flex items-center space-x-2">
            <label className="w-20 capitalize">{type}:</label>
            <input
              type="range"
              min="0"
              max="50"
              value={counts[type]}
              onChange={(e) => setCounts(prev => ({
                ...prev,
                [type]: parseInt(e.target.value)
              }))}
              className="w-48"
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
              className="w-16 px-2 py-1 border rounded"
            />
          </div>
        ))}
      </div>
      
      <div className="space-x-4 mb-4">
        <button
          onClick={handleStart}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={!isRunning}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
        >
          Stop
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Reset
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-300"
      />
    </div>
  );
};

export default Simulation;
