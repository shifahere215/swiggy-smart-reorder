"use client";

import { useState } from 'react';
import { EyeOff, Eye, ChevronLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function Cart() {
  const [isIncognito, setIsIncognito] = useState(false);
  const [itemCount, setItemCount] = useState(3);
  const [showAnomaly, setShowAnomaly] = useState(false);
  const [sessionEventId, setSessionEventId] = useState<string | null>(null);

  const handleToggle = () => {
    const newIncognito = !isIncognito;
    setIsIncognito(newIncognito);
    document.documentElement.setAttribute('data-theme', newIncognito ? 'incognito' : 'light');
  };

  const handleCheckout = async () => {
    // 1. Validate checkout for anomaly
    const res = await fetch('/api/checkout/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'f4190d49-fd12-4e32-b89e-211bb4ee3316', // We'll just use dummy user or let backend handle fallback
        itemCount,
        orderValue: itemCount * 50,
        isIncognito
      })
    });
    const data = await res.json();
    setSessionEventId(data.sessionEventId);

    if (data.isAnomaly) {
      setShowAnomaly(true);
    } else {
      completeCheckout(data.sessionEventId, null);
    }
  };

  const completeCheckout = async (eventId: string, label: string | null) => {
    await fetch('/api/checkout/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionEventId: eventId,
        label,
        skusPurchased: [] // mock empty for now
      })
    });
    
    // reset cart
    setShowAnomaly(false);
    setItemCount(0);
    const badge = document.getElementById('cart-badge');
    if (badge) badge.innerText = '0';
    
    // reset incognito for next session
    setIsIncognito(false);
    document.documentElement.setAttribute('data-theme', 'light');
    
    alert('Order placed successfully!');
  };

  return (
    <>
      <div className="header">
        <Link href="/" style={{ color: 'inherit' }}><ChevronLeft size={24} /></Link>
        <h1>Cart</h1>
        <div style={{ width: 24 }}></div>
      </div>

      {isIncognito && (
        <div className="incognito-banner">
          <EyeOff size={16} /> Incognito on · this order won't be remembered.
        </div>
      )}

      <div className="cart-page">
        <div className="incognito-toggle">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', backgroundColor: isIncognito ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0,0,0,0.05)', borderRadius: '8px', color: isIncognito ? 'var(--incognito-primary)' : 'inherit' }}>
              {isIncognito ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Incognito mode</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hide from personalisation</p>
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={isIncognito} onChange={handleToggle} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="cart-item">
          <div>
            <h3>Mock Cart Items</h3>
            <p>Select item count to simulate bulk order</p>
          </div>
          <select 
            value={itemCount} 
            onChange={e => setItemCount(parseInt(e.target.value))}
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
          >
            <option value={1}>1 item (Normal)</option>
            <option value={3}>3 items (Normal)</option>
            <option value={15}>15 items (Bulk - triggers anomaly)</option>
          </select>
        </div>

        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 600 }}>
            <span>Total to pay</span>
            <span>₹{itemCount * 50}</span>
          </div>
          <button 
            className="btn-add" 
            style={{ width: '100%', padding: '16px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            onClick={handleCheckout}
            disabled={itemCount === 0}
          >
            Checkout <CreditCard size={18} />
          </button>
        </div>
      </div>

      {showAnomaly && (
        <div className="bottom-sheet-overlay">
          <div className="bottom-sheet">
            <h2>Bigger basket than usual</h2>
            <p>Stocking up for something special? Label this order so we don't mess up your regular nudges.</p>
            
            <div className="label-grid">
              <button className="label-btn" onClick={() => completeCheckout(sessionEventId!, 'Party / get-together')}>Party / get-together</button>
              <button className="label-btn" onClick={() => completeCheckout(sessionEventId!, 'Festive occasion')}>Festive occasion</button>
              <button className="label-btn" onClick={() => completeCheckout(sessionEventId!, 'Not feeling well')}>Not feeling well</button>
              <button className="label-btn" onClick={() => completeCheckout(sessionEventId!, 'Bulk stock-up')}>Bulk stock-up</button>
            </div>
            
            <button className="skip-btn" onClick={() => completeCheckout(sessionEventId!, null)}>
              Skip — don't label this order
            </button>
          </div>
        </div>
      )}
    </>
  );
}
