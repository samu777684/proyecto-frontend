import React, { useState, useEffect } from 'react';
import Login from './Login';
import AdminPanel from './AdminPanel';
import UserPanel from './UserPanel';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL;


export default function App(){
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [user, setUser] = useState(null);

  useEffect(()=>{
    if(token){
      axios.get(API + '/api/me', { headers: { Authorization: 'Bearer ' + token } })
        .then(r=> setUser(r.data))
        .catch(()=> { setToken(null); setRole(null); localStorage.removeItem('token'); localStorage.removeItem('role'); })
    }
  },[token]);

  if(!token) return <Login onLogin={({token, role})=>{ setToken(token); setRole(role); localStorage.setItem('token', token); localStorage.setItem('role', role); }} />

  if(role === 'admin') return <AdminPanel token={token} logout={()=>{ setToken(null); setRole(null); localStorage.clear(); }} api={API} />;
  return <UserPanel token={token} logout={()=>{ setToken(null); setRole(null); localStorage.clear(); }} api={API} />;
}
