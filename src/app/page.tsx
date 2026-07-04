"use client";

import { useEffect, useState } from 'react';
import { Sparkles, Plus, X } from 'lucide-react';

export default function Home() {
  const [nudges, setNudges] = useState<any[]>([]);
  const [activeAnomaly, setActiveAnomaly] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [cartSkus, setCartSkus] = useState<string[]>([]);
  const [anomalySuggestion, setAnomalySuggestion] = useState<any>(null);

  useEffect(() => {
    fetch('/api/nudges')
      .then(r => r.json())
      .then(data => {
        if (data.activeAnomaly) {
          setActiveAnomaly(data.activeAnomaly);
        } else {
          setNudges(data.nudges || []);
        }
      });
    
    fetch('/api/catalog')
      .then(r => r.json())
      .then(data => setCatalog(data.items || []));
  }, []);

  const handleNudgeAction = async (profileId: string, action: 'add' | 'dismiss') => {
    if (action === 'add') {
      const badge = document.getElementById('cart-badge');
      if (badge) badge.innerText = (parseInt(badge.innerText) + 1).toString();
      
      // Mark added
      setNudges(prev => prev.map(n => n.id === profileId ? { ...n, added: true } : n));
    } else {
      setNudges(prev => prev.filter(n => n.id !== profileId));
    }
    
    await fetch('/api/nudges/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, action })
    });
  };

  const handleAddToCart = async (skuId: string) => {
    const badge = document.getElementById('cart-badge');
    if (badge) badge.innerText = (parseInt(badge.innerText) + 1).toString();
    
    const newCartSkus = [...cartSkus, skuId];
    setCartSkus(newCartSkus);
    
    if (newCartSkus.length > 0) {
      try {
        const res = await fetch('/api/cart/similarity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartSkus: newCartSkus })
        });
        const data = await res.json();
        if (data.suggestion) {
          setAnomalySuggestion(data.suggestion);
        } else {
          setAnomalySuggestion(null);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const showNudgeCard = nudges.length > 0 && !activeAnomaly;

  return (
    <>
      <div className="header">
        <h1>Instamart</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/api/auth/login" className="btn-add" style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#FF5200', color: 'white', textDecoration: 'none' }}>Connect Swiggy</a>
          <UserAvatar />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeAnomaly && (
          <div style={{ margin: '16px', padding: '16px', backgroundColor: '#dbeafe', borderRadius: '12px' }}>
            <p style={{ color: '#1e3a8a', fontSize: '0.9rem' }}>
              <strong>Party Mode!</strong> Showing suggestions for {activeAnomaly}.
            </p>
          </div>
        )}

        {anomalySuggestion && (
          <div className="nudge-card" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <div className="nudge-header">
              <h2><Sparkles size={18} color="#166534" /> {anomalySuggestion.name}</h2>
              <button className="btn-dismiss" onClick={() => setAnomalySuggestion(null)}>Dismiss</button>
            </div>
            <div className="nudge-list">
              <p style={{ padding: '0 16px', color: '#166534', fontWeight: '500' }}>{anomalySuggestion.message}</p>
              {anomalySuggestion.items.map((item: any) => (
                <div key={item.id} className="nudge-item">
                  <div className="nudge-item-info">
                    <h3>{item.name}</h3>
                    <p>₹{item.price}</p>
                  </div>
                  <div className="nudge-actions">
                    <button className="btn-add" onClick={() => {
                        handleAddToCart(item.id);
                        setAnomalySuggestion((prev: any) => ({
                            ...prev,
                            items: prev.items.filter((i: any) => i.id !== item.id)
                        }));
                    }}>Add to cart</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showNudgeCard && (
          <div className="nudge-card">
            <div className="nudge-header">
              <h2><Sparkles size={18} /> Smart Reorder</h2>
              <button className="btn-dismiss" onClick={() => setNudges([])}>Dismiss all</button>
            </div>
            <div className="nudge-list">
              {nudges.map(nudge => (
                <div key={nudge.id} className={`nudge-item ${nudge.added ? 'added' : ''}`}>
                  <div className="nudge-item-info">
                    <h3>{nudge.message || nudge.catalog.name}</h3>
                    <p>Usually every {Math.round(nudge.avg_days_between)} days · last bought {nudge.daysSince}d ago</p>
                  </div>
                  <div className="nudge-actions">
                    <button 
                      className="btn-add" 
                      onClick={() => handleNudgeAction(nudge.id, 'add')}
                      disabled={nudge.added}
                    >
                      {nudge.added ? 'Added' : 'Add to cart'}
                    </button>
                    {!nudge.added && (
                      <button className="btn-dismiss" onClick={() => handleNudgeAction(nudge.id, 'dismiss')}>
                        Not right now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="feed">
          <h2>All Categories</h2>
          <div className="catalog-grid">
            {catalog.map(item => (
              <div key={item.id} className="catalog-item">
                <h3>{item.name}</h3>
                <p>₹{item.price}</p>
                <button className="btn-add" style={{ width: '100%' }} onClick={() => handleAddToCart(item.id)}>
                  Add <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function UserAvatar() {
  return (
    <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 12, fontWeight: 'bold' }}>JD</span>
    </div>
  )
}
