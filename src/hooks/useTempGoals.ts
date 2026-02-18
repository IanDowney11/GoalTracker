'use client';

import { useState, useEffect, useCallback } from 'react';
import { TempGoalDef } from '@/types';
import { getTempGoalDefs, putTempGoalDef, deleteTempGoalDef } from '@/lib/db';

export function useTempGoals() {
  const [tempGoalDefs, setTempGoalDefs] = useState<TempGoalDef[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const defs = await getTempGoalDefs();
    setTempGoalDefs(defs);
    setLoaded(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveTempGoal = useCallback(async (def: TempGoalDef) => {
    await putTempGoalDef(def);
    await reload();
  }, [reload]);

  const removeTempGoal = useCallback(async (id: string) => {
    await deleteTempGoalDef(id);
    await reload();
  }, [reload]);

  return { tempGoalDefs, loaded, saveTempGoal, removeTempGoal, reload };
}
