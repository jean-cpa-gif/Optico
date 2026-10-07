import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { Operacao, Divida } from '@/types';

export interface CloudBackupData {
  operacoes: Operacao[];
  dividas?: Divida[];
  updatedAt: string; // ISO string
  updatedAtFormatted?: string;
  totalOperacoes: number;
  totalDividas?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  cloudBackupInfo: {
    lastBackupDate: string | null;
    totalOperacoes: number | null;
    totalDividas?: number | null;
  } | null;
  checkingCloud: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  fazerBackupNuvem: (operacoesLocais: Operacao[], dividasLocais?: Divida[]) => Promise<{ success: boolean; date: string; count: number }>;
  baixarDadosNuvem: () => Promise<{ success: boolean; dados?: Operacao[]; dividas?: Divida[]; updatedAt?: string; message?: string }>;
  verificarBackupNuvem: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingCloud, setCheckingCloud] = useState(false);
  const [cloudBackupInfo, setCloudBackupInfo] = useState<{
    lastBackupDate: string | null;
    totalOperacoes: number | null;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        // Fetch cloud backup metadata
        await fetchCloudMetadata(currentUser.uid);
      } else {
        setCloudBackupInfo(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchCloudMetadata = async (uid: string) => {
    try {
      setCheckingCloud(true);
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as CloudBackupData;
        setCloudBackupInfo({
          lastBackupDate: data.updatedAt || null,
          totalOperacoes: typeof data.totalOperacoes === 'number' ? data.totalOperacoes : (data.operacoes?.length ?? 0)
        });
      } else {
        setCloudBackupInfo({
          lastBackupDate: null,
          totalOperacoes: 0
        });
      }
    } catch (err) {
      console.error('Erro ao verificar metadados da nuvem:', err);
    } finally {
      setCheckingCloud(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Erro no login Google:', err);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error('Erro no login email:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error('Erro no cadastro email:', err);
      throw err;
    }
  };

  const logout = async () => {
    await fbSignOut(auth);
    setCloudBackupInfo(null);
  };

  const fazerBackupNuvem = async (operacoesLocais: Operacao[], dividasLocais?: Divida[]) => {
    if (!user) {
      throw new Error('Você precisa estar logado para fazer backup na nuvem.');
    }
    const nowIso = new Date().toISOString();
    const docRef = doc(db, 'users', user.uid);
    
    // Ler dividas do localStorage se não forem fornecidas explicitamente
    let dividasSalvar: Divida[] = dividasLocais || [];
    if (!dividasLocais) {
      try {
        const savedDividas = localStorage.getItem('opcoes-control-dividas-data');
        if (savedDividas) {
          dividasSalvar = JSON.parse(savedDividas);
        }
      } catch (e) {
        console.error('Erro ao ler dívidas locais para backup', e);
      }
    }

    await setDoc(docRef, {
      operacoes: operacoesLocais,
      dividas: dividasSalvar,
      updatedAt: nowIso,
      totalOperacoes: operacoesLocais.length,
      totalDividas: dividasSalvar.length,
      userEmail: user.email || 'Anônimo'
    }, { merge: true });

    setCloudBackupInfo({
      lastBackupDate: nowIso,
      totalOperacoes: operacoesLocais.length,
      totalDividas: dividasSalvar.length
    });

    return {
      success: true,
      date: nowIso,
      count: operacoesLocais.length
    };
  };

  const baixarDadosNuvem = async () => {
    if (!user) {
      throw new Error('Você precisa estar logado para baixar dados da nuvem.');
    }
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        message: 'Nenhum backup encontrado na nuvem para esta conta.'
      };
    }

    const data = docSnap.data() as CloudBackupData;
    setCloudBackupInfo({
      lastBackupDate: data.updatedAt || null,
      totalOperacoes: data.operacoes?.length ?? 0,
      totalDividas: data.dividas?.length ?? 0
    });

    return {
      success: true,
      dados: data.operacoes || [],
      dividas: data.dividas || [],
      updatedAt: data.updatedAt
    };
  };

  const verificarBackupNuvem = async () => {
    if (user) {
      await fetchCloudMetadata(user.uid);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      cloudBackupInfo,
      checkingCloud,
      loginWithGoogle,
      loginWithEmail,
      signUpWithEmail,
      logout,
      fazerBackupNuvem,
      baixarDadosNuvem,
      verificarBackupNuvem
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
