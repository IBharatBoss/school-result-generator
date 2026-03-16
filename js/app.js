/**
 * RC GEN PRO v8.1 - SYSTEM BOOTLOADER
 * Phase 8: Lifecycle Management & Demo Injection
 * Role: Orchestrator, Theme Enforcer, Data Seeder
 */

'use strict';

const App = {
    
    /**
     * 1. SYSTEM STARTUP SEQUENCE
     */
    init: async function() {
        console.group("🚀 SYSTEM BOOT SEQUENCE v8.1");
        
        console.log("%c [SYS] CHECKING DEPENDENCIES...", "color: #A1A1AA");
        try {
            this._verifyModules();
            
            console.log("%c [SYS] MOUNTING DATA CORE...", "color: #2563EB");
            State.init(); // Load Database
            
            console.log("%c [SYS] ENGAGING UI SYSTEMS...", "color: #10B981");
            UI.init();    // Render Interface (Includes Theme Check)

            // Post-Boot Routines
            this.setupShortcuts();
            this.checkEmptyState();

            console.log("%c [OK] SYSTEM OPTIMAL. READY FOR COMMAND.", "color: #10B981; font-weight: bold;");
            
            // Welcome Toast
            setTimeout(() => {
                const schoolName = State.data.school.name || "USER";
                UI.showToast('SYSTEM ONLINE', `WELCOME TO ${schoolName}`, 'info');
            }, 500);

        } catch (error) {
            console.error("❌ CRITICAL BOOT FAILURE:", error);
            this._renderBSOD(error.message);
        }
        console.groupEnd();
    },

    /**
     * Safety Check: Ensure all JS files loaded
     */
    _verifyModules: function() {
        if (typeof State === 'undefined') throw new Error("DATA CORE (State.js) MISSING");
        if (typeof Analytics === 'undefined') throw new Error("MATH ENGINE (Analytics.js) MISSING");
        if (typeof UI === 'undefined') throw new Error("UI CONTROLLER (UI.js) MISSING");
    },

    /**
     * 2. DEMO DATA INJECTION (The Magic Button)
     */
    checkEmptyState: function() {
        // If no students, activate the Initialize Button
        if (State.data.students.length === 0) {
            const btn = document.getElementById('btn-init-db');
            if (btn) {
                // Remove old listeners by cloning
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                newBtn.addEventListener('click', () => this.seedDemoData());
            }
        }
    },

    seedDemoData: function() {
        if (!confirm("LOAD SAMPLE DATA?\nThis will add 15 students with random marks.")) return;

        console.log("[SYS] GENERATING SYNTHETIC DATA...");
        
        const firstNames = ["AARAV", "VIVAAN", "ADITYA", "VIHAAN", "ARJUN", "SAI", "REYANSH", "AYAN", "KRISHNA", "ISHAAN", "DIYA", "SAANVI", "ANANYA", "AADHYA", "PARI"];
        const lastNames = ["SHARMA", "VERMA", "GUPTA", "MALHOTRA", "SINGH", "KUMAR", "PATEL", "IYER", "REDDY", "DAS"];
        
        const demoData = [];
        const subCount = State.data.subjects.length;
        
        // Use Defaults from State (v8.1 Logic)
        const totalWorkingDays = parseInt(State.data.school.totalWorkingDays) || 280;
        const maxMarks = parseInt(State.data.school.maxMarks) || 100;

        for (let i = 1; i <= 15; i++) {
            const marks = [];
            // Performance Profile (0.0 to 1.0)
            const profile = Math.random(); 
            
            for (let j = 0; j < subCount; j++) {
                let score;
                // Generate marks relative to Max Marks (e.g., if max is 50, score will be within 0-50)
                if (profile > 0.8) score = this._rand(Math.floor(maxMarks * 0.85), maxMarks); // Elite
                else if (profile > 0.3) score = this._rand(Math.floor(maxMarks * 0.40), Math.floor(maxMarks * 0.84)); // Average
                else score = this._rand(Math.floor(maxMarks * 0.15), Math.floor(maxMarks * 0.45)); // Critical
                
                marks.push(score);
            }

            // Attendance Logic
            const minAtt = Math.floor(totalWorkingDays * 0.65);
            const attDays = this._rand(minAtt, totalWorkingDays - 5);

            demoData.push({
                roll: 100 + i,
                name: `${firstNames[this._rand(0, firstNames.length - 1)]} ${lastNames[this._rand(0, lastNames.length - 1)]}`,
                father: `MR. ${lastNames[this._rand(0, lastNames.length - 1)]}`,
                marks: marks,
                attendance: attDays
            });
        }

        State.data.students = demoData;
        State.save(true);
        State.log('SYSTEM', 'TRAINING DATASET LOADED');
        
        // Refresh All Views
        UI.renderGridBody();
        UI.renderDashboard();
        UI.showToast('SUCCESS', '15 UNITS ADDED TO REGISTRY', 'success');
        
        // Hide Empty State
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('main-grid').style.display = 'table';
    },

    _rand: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 3. TACTICAL SHORTCUTS
     */
    setupShortcuts: function() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + S : Manual Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                State.save(true);
                UI.showToast('SYSTEM', 'MANUAL SNAPSHOT SAVED', 'success');
            }

            // Ctrl + P : Instant Print
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                // Ensure we are in print view before printing
                const printBtn = document.querySelector('[data-view="view-print"]');
                if(!printBtn.classList.contains('active')) {
                    printBtn.click();
                    setTimeout(() => window.print(), 500); // Wait for render
                } else {
                    window.print();
                }
            }
        });
    },

    /**
     * 4. CRITICAL FAILURE SCREEN (BSOD)
     */
    _renderBSOD: function(msg) {
        document.body.innerHTML = `
            <div style="height:100vh;background:#F4F4F5;color:#DC2626;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:monospace;text-align:center;">
                <h1 style="font-size:4rem;margin:0;">SYSTEM HALTED</h1>
                <p style="font-size:1.5rem;border:1px solid #DC2626;padding:10px;margin-top:20px;background:white;">ERR_CODE: ${msg}</p>
                <p style="color:#52525B;margin-top:20px;">CHECK CONSOLE LOGS [F12]</p>
                <button onclick="location.reload()" style="margin-top:30px;background:#18181B;color:#fff;border:none;padding:15px 30px;cursor:pointer;font-family:monospace;">REBOOT SYSTEM</button>
            </div>
        `;
    }
};

// =============================================================
// IGNITION
// =============================================================
document.addEventListener('DOMContentLoaded', () => App.init());