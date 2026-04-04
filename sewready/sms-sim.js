// ══════════════════════════════════════════════════════════════
//  SMS Simulation Script
//  Animates an iPhone with a real notification message
// ══════════════════════════════════════════════════════════════

(function() {
  const SMS_CSS = `
    .sms-sim-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 10000;
      display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);
      opacity: 0; pointer-events: none; transition: opacity 0.4s;
    }
    .sms-sim-overlay.active { opacity: 1; pointer-events: auto; }
    
    .iphone-frame {
      width: 300px; height: 600px; background: #000; border: 8px solid #333;
      border-radius: 40px; position: relative; overflow: hidden;
      box-shadow: 0 0 50px rgba(0,255,65,0.2);
    }
    .iphone-screen {
      width: 100%; height: 100%; background-image: url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80');
      background-size: cover; background-position: center; position: relative;
    }
    .iphone-notch {
      position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      width: 150px; height: 25px; background: #000; border-bottom-left-radius: 20px;
      border-bottom-right-radius: 20px; z-index: 10;
    }
    
    .sms-notification {
      position: absolute; top: 40px; left: 10px; right: 10px;
      background: rgba(255,255,255,0.9); border-radius: 18px; padding: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateY(-150px); transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .sms-notification.active { transform: translateY(0); }
    
    .sms-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .sms-icon { width: 20px; height: 20px; background: #22c55e; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; }
    .sms-app-name { font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; }
    .sms-time { font-size: 11px; color: #999; margin-left: auto; }
    .sms-body { font-size: 13px; color: #111; line-height: 1.4; font-family: -apple-system, sans-serif; }
    
    .sms-sim-close {
      position: absolute; bottom: -60px; left: 50%; transform: translateX(-50%);
      background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2);
      padding: 10px 24px; border-radius: 30px; cursor: pointer; font-size: 14px;
    }
  `;

  const style = document.createElement('style');
  style.textContent = SMS_CSS;
  document.head.appendChild(style);

  window.simulateReadySMS = function(shopName = "Lone Wolf Tactical") {
    const overlay = document.createElement('div');
    overlay.className = 'sms-sim-overlay';
    overlay.innerHTML = `
      <div class="iphone-frame">
        <div class="iphone-notch"></div>
        <div class="iphone-screen">
          <div class="sms-notification" id="smsNotif">
            <div class="sms-header">
              <div class="sms-icon">💬</div>
              <span class="sms-app-name">MESSAGES</span>
              <span class="sms-time">now</span>
            </div>
            <div class="sms-body">
              <strong>SewReady:</strong> Your OCP Top order at <strong>${shopName}</strong> is READY for pickup! 🧵 Check your status at sewing.ranger-beers.com
            </div>
          </div>
        </div>
        <button class="sms-sim-close" onclick="this.parentElement.parentElement.remove()">Close Preview</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Animate in
    setTimeout(() => overlay.classList.add('active'), 10);
    setTimeout(() => {
      const notif = document.getElementById('smsNotif');
      notif.classList.add('active');
      // Play a subtle ping sound if possible
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }, 1000);
  };
})();
