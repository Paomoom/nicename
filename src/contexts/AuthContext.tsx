import React, { createContext, useState, useContext, useEffect } from 'react';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  username: string;
  nickname?: string;
  email?: string;
  points: number;
  avatar?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  assignGuestId: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  
  // 从localStorage加载用户信息
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedIsGuest = localStorage.getItem('isGuest');
    
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    if (storedIsGuest === 'true') {
      setIsGuest(true);
    }
  }, []);
  
  // 生成随机的游客ID
  const generateGuestId = () => {
    return `User${Math.floor(100000 + Math.random() * 900000)}`;
  };
  
  // 分配游客ID
  const assignGuestId = () => {
    if (!currentUser && !isGuest) {
      const guestUser: User = {
        id: `guest-${Date.now()}`,
        username: generateGuestId(),
        points: 0,
        avatar: '/dog-avatar.png' // 默认小狗头像
      };
      
      setCurrentUser(guestUser);
      setIsGuest(true);
      
      localStorage.setItem('currentUser', JSON.stringify(guestUser));
      localStorage.setItem('isGuest', 'true');
    }
  };
  
  // 登录
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // 这里应该是实际的登录API调用
      // 目前简单模拟，实际项目中应该连接后端API
      
      // 模拟从localStorage获取用户数据
      const usersJson = localStorage.getItem('users') || '[]';
      const users = JSON.parse(usersJson);
      
      const user = users.find((u: any) => u.username === username);
      
      if (!user) {
        return false;
      }
      
      // 检查账户是否被锁定
      if (user.lockUntil && user.lockUntil > Date.now()) {
        throw new Error('账户已被锁定，请稍后再试');
      }
      
      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        // 更新登录失败次数
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        
        // 如果失败次数超过5次，锁定账户15分钟
        if (user.loginAttempts >= 5) {
          user.lockUntil = Date.now() + 15 * 60 * 1000; // 15分钟
          user.loginAttempts = 0;
        }
        
        // 更新用户信息
        const userIndex = users.findIndex((u: any) => u.username === username);
        users[userIndex] = user;
        localStorage.setItem('users', JSON.stringify(users));
        
        if (user.lockUntil) {
          throw new Error('登录失败次数过多，账户已被锁定15分钟');
        }
        return false;
      }
      
      // 登录成功，重置登录失败次数
      user.loginAttempts = 0;
      user.lockUntil = null;
      
      // 更新用户信息
      const userIndex = users.findIndex((u: any) => u.username === username);
      users[userIndex] = user;
      localStorage.setItem('users', JSON.stringify(users));
      
      if (user) {
        // 移除密码字段
        const { password, ...userWithoutPassword } = user;
        
        setCurrentUser(userWithoutPassword);
        setIsGuest(false);
        
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        localStorage.removeItem('isGuest');
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  };
  
  // 注册
  const register = async (username: string, password: string): Promise<boolean> => {
    try {
      // 这里应该是实际的注册API调用
      // 目前简单模拟，实际项目中应该连接后端API
      
      // 模拟从localStorage获取用户数据
      const usersJson = localStorage.getItem('users') || '[]';
      const users = JSON.parse(usersJson);
      
      // 检查用户名是否已存在
      if (users.some((u: any) => u.username === username)) {
        return false;
      }
      
      // 创建新用户
      // 使用bcrypt加密密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const newUser = {
        id: `user-${Date.now()}`,
        username,
        password: hashedPassword,
        nickname: username,
        email: '',
        points: 0,
        avatar: '/dog-avatar.png',
        loginAttempts: 0,
        lockUntil: null
      };
      
      // 保存到用户列表
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // 自动登录
      const { password: _, ...userWithoutPassword } = newUser;
      setCurrentUser(userWithoutPassword);
      setIsGuest(false);
      
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      localStorage.removeItem('isGuest');
      
      return true;
    } catch (error) {
      console.error('注册失败:', error);
      return false;
    }
  };
  
  // 登出
  const logout = () => {
    setCurrentUser(null);
    setIsGuest(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isGuest');
  };
  
  const value = {
    currentUser,
    isGuest,
    isAuthenticated: !!currentUser && !isGuest,
    login,
    register,
    logout,
    assignGuestId
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};