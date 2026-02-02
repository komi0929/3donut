import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DonutType, Position } from '../types';
import { GRID_SIZE, DONUT_COLORS } from '../constants';
import { Donut } from './Donut';
import { v4 as uuidv4 } from 'uuid';
import { soundManager } from '../services/audio';

interface EnhancedCell {
  id: string;
  type: DonutType;
  isMatched: boolean;
  row: number;
  col: number;
  visualRow: number;
  special?: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'RAINBOW';
  mergeOffset?: { x: number; y: number }; // マッチ時の中央集合アニメーション用
}

interface GameBoardProps {
  assets: Record<string, string>;
  onClear: (count: number, comboCount: number) => void;
  onMove: () => void;
  isInteractable: boolean;
  clearedCount: number;
  onParticle?: (x: number, y: number, color: string, count?: number) => void;
  onShake?: () => void;
  isFever?: boolean;
}

const COMBO_PHRASES = ["YUMMY!", "MOCHI!", "OISHI!", "GREAT!", "WOW!", "AMAZING!", "BONUS!", "COMBO!"];

import { SPECIAL_SPAWN_RATES } from '../constants';

// 通常ドーナツのみ生成（初期グリッド用）
const NORMAL_TYPES = [
  DonutType.STRAWBERRY, DonutType.VANILLA, DonutType.LEMON, 
  DonutType.CHOCOLATE, DonutType.MATCHA, DonutType.SODA
];

const generateNormalType = () => {
  return NORMAL_TYPES[Math.floor(Math.random() * NORMAL_TYPES.length)];
};

// レアドーナツを含む生成（ゲーム中の補充用）
const generateRandomType = () => {
  const rand = Math.random();
  const rates = SPECIAL_SPAWN_RATES;
  
  // Weighted Random Spawn
  if (rand < rates.RAINBOW) return DonutType.RAINBOW;
  if (rand < rates.RAINBOW + rates.GOLD) return DonutType.GOLD;
  if (rand < rates.RAINBOW + rates.GOLD + rates.SILVER) return DonutType.SILVER;

  return NORMAL_TYPES[Math.floor(Math.random() * NORMAL_TYPES.length)];
};

export const GameBoard: React.FC<GameBoardProps> = ({ 
  onClear, onMove, isInteractable, onParticle, onShake, isFever 
}) => {
  const [grid, setGrid] = useState<EnhancedCell[]>([]);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [comboTexts, setComboTexts] = useState<{id: string, x: number, y: number, text: string}[]>([]);
  const dragRef = useRef<{startR: number, startC: number, startX: number, startY: number} | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number, y: number} | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // For Tap Detection: Store start time/pos
  const tapRef = useRef<{startR: number, startC: number, startTime: number} | null>(null);

  useEffect(() => {
    let initialGrid: EnhancedCell[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        // 初期生成時は通常ドーナツのみ（レアは出さない）
        let type = generateNormalType();
        // マッチ回避のリトライ
        let attempts = 0;
        while (attempts < 10 && (
          (c >= 2 && initialGrid.find(cell => cell.row === r && cell.col === c-1)?.type === type && initialGrid.find(cell => cell.row === r && cell.col === c-2)?.type === type) ||
          (r >= 2 && initialGrid.find(cell => cell.row === r-1 && cell.col === c)?.type === type && initialGrid.find(cell => cell.row === r-2 && cell.col === c)?.type === type)
        )) {
          type = generateNormalType();
          attempts++;
        }
        initialGrid.push({ id: uuidv4(), type, isMatched: false, row: r, col: c, visualRow: r, special: 'NONE' });
      }
    }
    setGrid(initialGrid);
  }, []);

  const analyzeMatches = (currentGrid: EnhancedCell[]) => {
    const matched = new Set<string>();
    // No more bomb generation based on match count

    // Horizontal
    for (let r = 0; r < GRID_SIZE; r++) {
      let matchStart = 0;
      let matchLength = 1;
      for (let c = 1; c <= GRID_SIZE; c++) {
        const prev = currentGrid.find(cell => cell.row === r && cell.col === c - 1);
        const curr = c < GRID_SIZE ? currentGrid.find(cell => cell.row === r && cell.col === c) : null;
        
        // Special donuts do NOT match with normal ones or each other typically, 
        // unless we want them to act as wildcards. 
        // Request implies they are "Tap to Explode", so they shouldn't match normally.
        const isSpecial = (t: DonutType) => t === DonutType.GOLD || t === DonutType.SILVER || t === DonutType.RAINBOW;

        if (curr && prev && curr.type === prev.type && !isSpecial(curr.type)) {
          matchLength++;
        } else {
          if (matchLength >= 3) {
            for (let k = matchStart; k < c; k++) {
              const cell = currentGrid.find(cell => cell.row === r && cell.col === k);
              if (cell) matched.add(cell.id);
            }
          }
          matchStart = c;
          matchLength = 1;
        }
      }
    }

    // Vertical
    for (let c = 0; c < GRID_SIZE; c++) {
      let matchStart = 0;
      let matchLength = 1;
      for (let r = 1; r <= GRID_SIZE; r++) {
        const prev = currentGrid.find(cell => cell.row === r - 1 && cell.col === c);
        const curr = r < GRID_SIZE ? currentGrid.find(cell => cell.row === r && cell.col === c) : null;
        
        const isSpecial = (t: DonutType) => t === DonutType.GOLD || t === DonutType.SILVER || t === DonutType.RAINBOW;

        if (curr && prev && curr.type === prev.type && !isSpecial(curr.type)) {
          matchLength++;
        } else {
          if (matchLength >= 3) {
            for (let k = matchStart; k < r; k++) {
              const cell = currentGrid.find(cell => cell.row === k && cell.col === c);
              if (cell) matched.add(cell.id);
            }
          }
          matchStart = r;
          matchLength = 1;
        }
      }
    }

    return { matched, bombs: [] }; // bombs is unused but kept for interface compat if any
  };

  const expandExplosions = (
    currentGrid: EnhancedCell[], 
    matchedIds: Set<string>
  ): Set<string> => {
    let expanded = new Set(matchedIds);
    let toCheck = [...matchedIds];
    let checked = new Set<string>();

    while (toCheck.length > 0) {
      const id = toCheck.pop()!;
      if (checked.has(id)) continue;
      checked.add(id);

      const cell = currentGrid.find(c => c.id === id);
      if (!cell || !cell.special || cell.special === 'NONE') continue;

      if (cell.special === 'HORIZONTAL' || cell.special === 'VERTICAL') {
          soundManager.playBomb();
      }

      if (cell.special === 'HORIZONTAL') {
        const rowCells = currentGrid.filter(c => c.row === cell.row);
        rowCells.forEach(c => {
           if (!expanded.has(c.id)) {
             expanded.add(c.id);
             toCheck.push(c.id);
           }
        });
      } else if (cell.special === 'VERTICAL') {
        const colCells = currentGrid.filter(c => c.col === cell.col);
        colCells.forEach(c => {
           if (!expanded.has(c.id)) {
             expanded.add(c.id);
             toCheck.push(c.id);
           }
        });
      } else if (cell.special === 'RAINBOW') {
        const targetType = generateRandomType();
        const sameTypeCells = currentGrid.filter(c => c.type === targetType);
        sameTypeCells.forEach(c => {
           if (!expanded.has(c.id)) {
             expanded.add(c.id);
             toCheck.push(c.id);
           }
        });
      }
    }
    return expanded;
  };

  const processBoard = useCallback(async (currentGrid: EnhancedCell[]) => {
    setIsProcessing(true);
    let workingGrid = [...currentGrid];
    let comboCount = 0;

    while (true) {
      const { matched: initialMatched, bombs } = analyzeMatches(workingGrid);
      if (initialMatched.size === 0) break;

      const finalMatchedIds = expandExplosions(workingGrid, initialMatched);
      const matchedCells = workingGrid.filter(c => finalMatchedIds.has(c.id));
      
      // ぷよぷよ風: マッチしたセルの中央座標を計算
      if (matchedCells.length > 0) {
        const centerRow = matchedCells.reduce((sum, c) => sum + c.row, 0) / matchedCells.length;
        const centerCol = matchedCells.reduce((sum, c) => sum + c.col, 0) / matchedCells.length;
        const cellSize = 100 / GRID_SIZE;
        
        // 各セルに中央へ向かうオフセットを設定（ピクセル単位）
        workingGrid = workingGrid.map(cell => {
          if (finalMatchedIds.has(cell.id)) {
            // 中央に向かって70%移動
            const offsetX = (centerCol - cell.col) * 70;
            const offsetY = (centerRow - cell.row) * 70;
            return { ...cell, isMatched: true, mergeOffset: { x: offsetX, y: offsetY } };
          }
          return { ...cell, mergeOffset: undefined };
        });
      } else {
        workingGrid = workingGrid.map(cell => ({ ...cell, isMatched: finalMatchedIds.has(cell.id) }));
      }
      
      setGrid(workingGrid);
      
      soundManager.playMatch(comboCount);
      if (finalMatchedIds.size >= 5 || comboCount >= 2) {
        soundManager.playBigClear();
        onShake?.();
      }
      
      onClear(finalMatchedIds.size, comboCount);

      // パーティクル
      const cellSizePx = window.innerWidth * 0.9 / GRID_SIZE; 
      matchedCells.forEach(cell => {
        const colors = DONUT_COLORS[cell.type];
        const x = (cell.col + 0.5) * cellSizePx + (window.innerWidth * 0.05);
        const y = (cell.row + 0.5) * cellSizePx + 100;
        onParticle?.(x, y, colors.frosting, finalMatchedIds.size >= 4 ? 16 : 10);
      });

      const pivot = workingGrid.find(c => finalMatchedIds.has(c.id));
      if (pivot) {
        const cid = uuidv4();
        const msg = bombs.length > 0 ? "NICE!" : (comboCount > 0 ? `${comboCount + 1} COMBO!` : COMBO_PHRASES[Math.floor(Math.random() * COMBO_PHRASES.length)]);
        setComboTexts(prev => [...prev, { 
          id: cid, 
          x: (pivot.col + 0.5) * (100 / GRID_SIZE), 
          y: (pivot.row + 0.5) * (100 / GRID_SIZE), 
          text: msg
        }]);
        setTimeout(() => setComboTexts(prev => prev.filter(t => t.id !== cid)), 500);
      }

      // マージアニメーション時間（集合）
      await new Promise(r => setTimeout(r, 350));
      
      // 爆発演出: スケールアップしてから消える
      workingGrid = workingGrid.map(cell => {
        if (finalMatchedIds.has(cell.id)) {
          return { ...cell, mergeOffset: { x: 0, y: 0 } }; // 中央に戻しつつ爆発
        }
        return cell;
      });
      setGrid(workingGrid);
      
      // 爆発の余韻
      await new Promise(r => setTimeout(r, 150));

      const bombCells = new Set<string>();
      const newGridState = [...workingGrid];
      
      bombs.forEach(b => {
        const target = newGridState.find(c => c.row === b.row && c.col === b.col);
        if (target && finalMatchedIds.has(target.id)) {
           target.special = b.type;
           target.isMatched = false;
           bombCells.add(target.id);
        }
      });
      
      const nextGrid: EnhancedCell[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const column = newGridState.filter(cell => cell.col === c);
        const survivors = column.filter(cell => !finalMatchedIds.has(cell.id) || bombCells.has(cell.id));
        survivors.sort((a, b) => b.row - a.row);
        
        survivors.forEach((cell, i) => {
          nextGrid.push({ 
            ...cell, 
            row: GRID_SIZE - 1 - i, 
            visualRow: GRID_SIZE - 1 - i, 
            isMatched: false 
          });
        });
        
        const missing = GRID_SIZE - survivors.length;
        for (let i = 0; i < missing; i++) {
          const targetRow = missing - 1 - i;
          nextGrid.push({
            id: uuidv4(),
            type: generateRandomType(),
            isMatched: false,
            row: targetRow,
            col: c,
            visualRow: targetRow - GRID_SIZE,
            special: 'NONE'
          });
        }
      }

      setGrid(nextGrid);
      await new Promise(r => setTimeout(r, 20));

      workingGrid = nextGrid.map(cell => ({ ...cell, visualRow: cell.row }));
      setGrid(workingGrid);
      
      await new Promise(r => setTimeout(r, 250));
      comboCount++;
    }
    setIsProcessing(false);
  }, [onClear, onParticle, onShake]);

  const handleSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    // 即座にUI更新（isProcessingを最初に設定しない）
    setSelectedPos(null);
    setDragOffset(null);
    
    soundManager.init();
    soundManager.playSwap();

    let newGrid = grid.map(cell => {
      if (cell.row === r1 && cell.col === c1) return { ...cell, row: r2, col: c2, visualRow: r2 };
      if (cell.row === r2 && cell.col === c2) return { ...cell, row: r1, col: c1, visualRow: r1 };
      return cell;
    });

    setGrid(newGrid);
    onMove();

    const cell1 = grid.find(c => c.row === r1 && c.col === c1);
    const cell2 = grid.find(c => c.row === r2 && c.col === c2);
    const rainbowCell = cell1?.special === 'RAINBOW' ? cell1 : (cell2?.special === 'RAINBOW' ? cell2 : null);
    const otherCell = rainbowCell === cell1 ? cell2 : cell1;

    if (rainbowCell && otherCell) {
       setIsProcessing(true);
       await new Promise(r => setTimeout(r, 150));
       soundManager.playFeverStart();
       
       const targetType = otherCell.type;
       const matchedIds = new Set<string>([rainbowCell.id]);
       
       if (otherCell.special === 'RAINBOW') {
          newGrid.forEach(c => matchedIds.add(c.id));
          onShake?.();
          soundManager.playWin();
       } else {
          newGrid.forEach(c => {
             if (c.type === targetType) matchedIds.add(c.id);
          });
       }

       const flashGrid = newGrid.map(cell => ({ ...cell, isMatched: matchedIds.has(cell.id) }));
       setGrid(flashGrid);
       
       await new Promise(r => setTimeout(r, 300));
       
       onClear(matchedIds.size, 0);
       
       const nextGrid: EnhancedCell[] = [];
       for (let c = 0; c < GRID_SIZE; c++) {
          const column = newGrid.filter(cell => cell.col === c);
          const survivors = column.filter(cell => !matchedIds.has(cell.id));
          survivors.sort((a, b) => b.row - a.row);
          survivors.forEach((cell, i) => {
             nextGrid.push({ ...cell, row: GRID_SIZE - 1 - i, visualRow: GRID_SIZE - 1 - i, isMatched: false });
          });
          const missing = GRID_SIZE - survivors.length;
          for (let i = 0; i < missing; i++) {
             const targetRow = missing - 1 - i;
             nextGrid.push({
               id: uuidv4(),
               type: generateRandomType(),
               isMatched: false,
               row: targetRow,
               col: c,
               visualRow: targetRow - GRID_SIZE,
               special: 'NONE'
             });
          }
       }
       setGrid(nextGrid);
       await new Promise(r => setTimeout(r, 20));
       const afterFallGrid = nextGrid.map(cell => ({ ...cell, visualRow: cell.row }));
       setGrid(afterFallGrid);
       await new Promise(r => setTimeout(r, 150));
       
       processBoard(afterFallGrid);
       return;
    }

    // 通常スワップ: 待機なしで即座にマッチ判定
    const { matched } = analyzeMatches(newGrid);
    if (matched.size > 0) {
      setIsProcessing(true);
      processBoard(newGrid);
    }
    // マッチなしの場合はisProcessingを設定しない→次のスワイプ即可能
  };

  const activateSpecial = (cell: EnhancedCell) => {
    if (isProcessing) return;
    
    // Determine explosion range based on type
    const matchedIds = new Set<string>();
    matchedIds.add(cell.id);
    
    if (cell.type === DonutType.SILVER) {
       // Silver: 3x3
       grid.forEach(c => {
         if (Math.abs(c.row - cell.row) <= 1 && Math.abs(c.col - cell.col) <= 1) {
           matchedIds.add(c.id);
         }
       });
       soundManager.playBomb();
    } else if (cell.type === DonutType.GOLD) {
       // Gold: Row & Col
       grid.forEach(c => {
         if (c.row === cell.row || c.col === cell.col) {
           matchedIds.add(c.id);
         }
       });
       soundManager.playBomb();
    } else if (cell.type === DonutType.RAINBOW) {
       // Rainbow: Row, Col, Diagonals
       grid.forEach(c => {
         if (c.row === cell.row || c.col === cell.col || Math.abs(c.row - cell.row) === Math.abs(c.col - cell.col)) {
           matchedIds.add(c.id);
         }
       });
       soundManager.playFeverStart(); // Stronger sound for Rainbow
    } else {
      return; // Not special
    }
    
    // Trigger explosion
    handleExplosion(matchedIds);
  };
  
  const handleExplosion = async (matchedIds: Set<string>) => {
    setIsProcessing(true);
    
    // Visual update
    setGrid(prev => prev.map(c => ({ ...c, isMatched: matchedIds.has(c.id) })));
    onShake?.();
    soundManager.playBigClear();
    
    await new Promise(r => setTimeout(r, 500));
    
    onClear(matchedIds.size, 0); // Count as clear
    
    // Particles
    const cellSizePx = window.innerWidth * 0.9 / GRID_SIZE; 
    grid.filter(c => matchedIds.has(c.id)).forEach(cell => {
         const colors = DONUT_COLORS[cell.type] || DONUT_COLORS.VANILLA;
         const x = (cell.col + 0.5) * cellSizePx + (window.innerWidth * 0.05);
         const y = (cell.row + 0.5) * cellSizePx + 100;
         onParticle?.(x, y, colors.frosting || '#FFF', 12);
    });

    // Process falling
    const nextGrid: EnhancedCell[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      const column = grid.filter(cell => cell.col === c);
      const survivors = column.filter(cell => !matchedIds.has(cell.id));
      survivors.sort((a, b) => b.row - a.row);
      
      survivors.forEach((cell, i) => {
        nextGrid.push({ 
          ...cell, 
          row: GRID_SIZE - 1 - i, 
          visualRow: GRID_SIZE - 1 - i, 
          isMatched: false 
        });
      });
      
      const missing = GRID_SIZE - survivors.length;
      for (let i = 0; i < missing; i++) {
        const targetRow = missing - 1 - i;
        // Generate new random types (can include specials)
        let type = generateRandomType();
        nextGrid.push({
          id: uuidv4(),
          type,
          isMatched: false,
          row: targetRow,
          col: c,
          visualRow: targetRow - GRID_SIZE,
          special: 'NONE'
        });
      }
    }

    setGrid(nextGrid);
    await new Promise(r => setTimeout(r, 20));

    const afterFallGrid = nextGrid.map(cell => ({ ...cell, visualRow: cell.row }));
    setGrid(afterFallGrid);
    
    await new Promise(r => setTimeout(r, 200)); // Optimize fall delay
    processBoard(afterFallGrid);
  };

  // Simplified Touch Logic
  const handlePointerDown = (e: React.PointerEvent, r: number, c: number) => {
    if (!isInteractable) return;
    e.preventDefault(); // タッチスクロール防止
    
    setSelectedPos({ row: r, col: c });
    dragRef.current = { startR: r, startC: c, startX: e.clientX, startY: e.clientY };
    tapRef.current = { startR: r, startC: c, startTime: Date.now() };
    setDragOffset({ x: 0, y: 0 });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (tapRef.current && !isProcessing) {
       const { startR, startC, startTime } = tapRef.current;
       const duration = Date.now() - startTime;
       const dist = Math.sqrt(Math.pow(e.clientX - (dragRef.current?.startX || 0), 2) + Math.pow(e.clientY - (dragRef.current?.startY || 0), 2));
       
       if (duration < 300 && dist < 10) {
           const cell = grid.find(c => c.row === startR && c.col === startC);
           if (cell && (cell.type === DonutType.GOLD || cell.type === DonutType.SILVER || cell.type === DonutType.RAINBOW)) {
               activateSpecial(cell);
               setSelectedPos(null);
               setDragOffset(null);
               dragRef.current = null;
               tapRef.current = null;
               return; 
           }
       }
    }
    
    setDragOffset(null);
    setSelectedPos(null);
    dragRef.current = null;
    tapRef.current = null;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    
    const { startR, startC, startX, startY } = dragRef.current;
    const moveX = e.clientX - startX;
    const moveY = e.clientY - startY;
    
    // 即座にオフセット更新（animationFrame削除で高速化）
    setDragOffset({ x: moveX, y: moveY });
    
    // 超低閾値: 10px で即座にスワップ
    const swapThreshold = 10;
    
    if (Math.abs(moveX) > swapThreshold || Math.abs(moveY) > swapThreshold) {
      let tr = startR, tc = startC;
      
      if (Math.abs(moveX) > Math.abs(moveY)) {
        tc = moveX > 0 ? startC + 1 : startC - 1;
      } else {
        tr = moveY > 0 ? startR + 1 : startR - 1;
      }

      if (tr >= 0 && tr < GRID_SIZE && tc >= 0 && tc < GRID_SIZE) {
        // 即座にスワップ実行
        handleSwap(startR, startC, tr, tc);
        
        // ドラッグ終了（連続ドラッグを無効化してシンプルに）
        dragRef.current = null;
        tapRef.current = null;
        setDragOffset(null);
        setSelectedPos(null);
      }
    }
  };

  const cellSize = 100 / GRID_SIZE;

  return (
    <div className="relative w-full max-w-[min(90vw,500px)] aspect-square bg-[#FFE4C4]/60 rounded-[2.5rem] p-3 shadow-2xl border-[8px] border-white overflow-hidden mx-auto select-none"
         onPointerMove={handlePointerMove}
         onPointerUp={handlePointerUp} 
         onPointerLeave={() => { 
             setDragOffset(null);
             setSelectedPos(null);
             dragRef.current = null;
         }}>
      
      {comboTexts.map(t => (
        <div key={t.id} className="combo-text font-black text-[#FF6347] italic text-3xl"
             style={{ left: `${t.x}%`, top: `${t.y}%`, WebkitTextStroke: '1.5px white' }}>{t.text}</div>
      ))}

      {grid.map((cell) => {
        const isSelected = selectedPos?.row === cell.row && selectedPos?.col === cell.col;
        const isDragging = isSelected && dragOffset !== null;
        const hasMergeOffset = cell.mergeOffset && cell.isMatched;
        
        let dragTransform = '';
        if (isDragging && dragOffset) {
          dragTransform = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`;
        } else if (hasMergeOffset) {
          // ぷよぷよ風: 集合してから爆発
          const isExploding = cell.mergeOffset!.x === 0 && cell.mergeOffset!.y === 0;
          if (isExploding) {
            dragTransform = 'scale(1.8)'; // 爆発時に大きく膨らむ
          } else {
            dragTransform = `translate(${cell.mergeOffset!.x}px, ${cell.mergeOffset!.y}px) scale(1.2)`;
          }
        } else if (isSelected) {
          dragTransform = 'scale(1.1) translate3d(0,-8px,0)';
        } else {
          dragTransform = 'scale(1) translate3d(0,0,0)';
        }
        
        return (
          <div
            key={cell.id}
            className={`absolute p-1 gpu-layer ${cell.visualRow === cell.row && !isProcessing ? 'animate-land' : ''}`}
            style={{
              width: `${cellSize}%`,
              height: `${cellSize}%`,
              left: `${cell.col * cellSize}%`,
              top: `${cell.visualRow * cellSize}%`,
              // ぼよんと弾む bouncy transition
              transition: hasMergeOffset 
                ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease-out 0.25s' 
                : (isDragging ? 'none' : (isProcessing 
                  ? 'top 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                  : 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)')),
              zIndex: isSelected || hasMergeOffset ? 100 : 10,
              // mergeOffsetがある間は完全に見える、爆発後にフェードアウト
              opacity: hasMergeOffset ? 1 : (cell.isMatched ? 0 : 1),
              transform: dragTransform,
              willChange: isDragging || hasMergeOffset ? 'transform, opacity' : 'auto',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onPointerDown={(e) => handlePointerDown(e, cell.row, cell.col)}
          >
            <Donut type={cell.type} isSelected={isSelected} isMatched={cell.isMatched} special={cell.special} />
          </div>
        );
      })}
    </div>
  );
};