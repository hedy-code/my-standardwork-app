import { useState, useCallback } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { TaskRow } from '../App';

export interface ChartDocument {
  id?: string;
  userId: string;
  workshopName: string;
  processName: string;
  globalTimeUnit: 'min' | 'sec';
  scaleValue: number;
  scaleUnit: 'hour' | 'min' | 'sec';
  rows: TaskRow[];
  updatedAt?: any;
}

export const useFirestore = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveChart = useCallback(async (chartData: Omit<ChartDocument, 'userId'>, chartId?: string) => {
    if (!user) {
      setError("User not authenticated.");
      return null;
    }
    
    setLoading(true);
    setError(null);
    try {
      const chartsRef = collection(db, 'users', user.uid, 'charts');
      const docRef = chartId ? doc(chartsRef, chartId) : doc(chartsRef);
      
      const dataToSave = {
        ...chartData,
        userId: user.uid,
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, dataToSave, { merge: true });
      return docRef.id;
    } catch (err: any) {
      console.error("Error saving chart:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadCharts = useCallback(async () => {
    if (!user) return [];
    
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'users', user.uid, 'charts'), 
        orderBy("updatedAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const charts: ChartDocument[] = [];
      querySnapshot.forEach((doc) => {
        charts.push({ id: doc.id, ...doc.data() } as ChartDocument);
      });
      return charts;
    } catch (err: any) {
      console.error("Error loading charts:", err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteChart = useCallback(async (chartId: string) => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'charts', chartId));
      return true;
    } catch (err: any) {
      console.error("Error deleting chart:", err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  const getChart = useCallback(async (chartId: string) => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    try {
      const docSnap = await getDoc(doc(db, 'users', user.uid, 'charts', chartId));
      if (docSnap.exists()) {
         return { id: docSnap.id, ...docSnap.data() } as ChartDocument;
      }
      return null;
    } catch (err: any) {
      console.error("Error getting chart:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    saveChart,
    loadCharts,
    deleteChart,
    getChart,
    loading,
    error
  };
};
