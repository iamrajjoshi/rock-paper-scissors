import { useState, useEffect, useRef, useCallback } from 'react';
import Controls from './components/Controls';
import SimulationGraph from './components/SimulationGraph';
import { ObjectType, SimObject, Counts } from './types';

const Simulation = () => {
  const initialCounts: Counts = { rock: 10, paper: 10, scissors: 10 };
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [speed, setSpeed] = useState<number>(2.5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const objectsRef = useRef<SimObject[]>([]);
  const [graphData, setGraphData] = useState<{ timestamp: number; counts: Counts }[]>([]);

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

  const updateGraphData = useCallback(() => {
    const currentCounts: Counts = {
      rock: 0,
      paper: 0,
      scissors: 0
    };
    
    objectsRef.current.forEach(obj => {
      currentCounts[obj.type]++;
    });

    setGraphData(prev => [...prev, {
      timestamp: Date.now(),
      counts: { ...currentCounts }
    }]);
  }, []);

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

    updateGraphData();

    if (isRunning) {
      animationRef.current = requestAnimationFrame(updatePositions);
    }
  }, [isRunning, updateGraphData]);

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
    setGraphData([]);
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

  const handleExportData = () => {
    const csvContent = [
      'Timestamp,Rock,Paper,Scissors',
      ...graphData.map(({ timestamp, counts }) => 
        `${new Date(timestamp).toISOString()},${counts.rock},${counts.paper},${counts.scissors}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'simulation_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      <SimulationGraph 
        data={graphData}
        onExportData={handleExportData}
      />

      <Controls
        isRunning={isRunning}
        speed={speed}
        counts={counts}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
        onSpeedChange={(newSpeed) => {
          setSpeed(newSpeed);
          if (isRunning) {
            objectsRef.current.forEach(obj => {
              const currentSpeed = Math.sqrt(obj.dx * obj.dx + obj.dy * obj.dy);
              const scale = newSpeed / currentSpeed;
              obj.dx *= scale;
              obj.dy *= scale;
            });
          }
        }}
        onCountChange={(type, newCount) => {
          setCounts(prev => ({
            ...prev,
            [type]: newCount
          }));
          if (isRunning) {
            updateObjectCount(type, newCount);
          }
        }}
      />
    </div>
  );
};

export default Simulation;