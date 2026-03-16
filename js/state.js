/**
 * RC GEN PRO v8.1 - DATA INTELLIGENCE ENGINE
 * Phase 5: Centralized State, Persistence & Defaults
 * Logic: Custom Defaults, Max Marks Support, Robust I/O
 */

'use strict';

// =============================================================
// 1. SYSTEM CONFIGURATION
// =============================================================
const APP_Config = {
    DB_KEY: 'rc_gen_nasa_v8_1_db', // Updated Key for v8.1
    THEME_KEY: 'rc_gen_theme_mode',
    SAVE_DELAY: 800, // Debounce time (ms)
    VERSION: '8.1.0'
};

// =============================================================
// 2. DEFAULT DATA SCHEMA (Your Specific Defaults)
// =============================================================
const defaultState = {
    meta: {
        version: APP_Config.VERSION,
        created: new Date().toISOString(),
        lastModified: null
    },
    school: {
        // YOUR CUSTOM DEFAULTS
        name: "SHANTI NIKETAN",
        address: "BALOTRA",
        affiliation: "RBSE-1999",
        logo: "logo.png",       
        totalWorkingDays: 280,  
        maxMarks: 100           // NEW: Global Max Marks Setting
    },
    exam: {
        name: "ANNUAL EXAMINATION",
        session: "2025-2026",
        watermark: true,
        marksStructure: "single",
        annualExams: [
            { id: "ut1", name: "Unit Test 1", short: "UT1", order: 1 },
            { id: "ut2", name: "Unit Test 2", short: "UT2", order: 2 },
            { id: "ut3", name: "Unit Test 3", short: "UT3", order: 3 },
            { id: "halfYearly", name: "Half-Yearly", short: "HY", order: 4 },
            { id: "annual", name: "Annual", short: "AN", order: 5 }
        ],
        useAnnualReport: false
    },
    grading: [
        { min: 91, max: 100, grade: 'A1', desc: 'Outstanding' },
        { min: 81, max: 90, grade: 'A2', desc: 'Excellent' },
        { min: 71, max: 80, grade: 'B1', desc: 'Very Good' },
        { min: 61, max: 70, grade: 'B2', desc: 'Good' },
        { min: 51, max: 60, grade: 'C1', desc: 'Average' },
        { min: 33, max: 50, grade: 'D', desc: 'Pass' },
        { min: 0, max: 32, grade: 'E', desc: 'Fail' }
    ],
    subjects: ["HINDI", "ENGLISH", "MATHS", "SCIENCE", "SST"], // Default Subjects
    students: [], // The Payload
    logs: [] // Audit Trail
};

// =============================================================
// 3. STATE CONTROLLER (The Brain)
// =============================================================
const State = {
    data: null,
    _saveTimer: null,

    /**
     * Boot up the Data Engine
     */
    init: function() {
        console.log("%c 💾 INITIALIZING DATA CORE v8.1... ", "color: #2563EB");
        const stored = localStorage.getItem(APP_Config.DB_KEY);

        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                
                // Deep Merge Strategy: Ensure new fields (like maxMarks) are added to old data
                this.data = { 
                    ...defaultState, 
                    ...parsed, 
                    school: { ...defaultState.school, ...parsed.school },
                    exam: { ...defaultState.exam, ...parsed.exam },
                    meta: { ...defaultState.meta, ...parsed.meta }
                };
                
                // Version Migration Check
                if (this.data.meta.version !== APP_Config.VERSION) {
                    console.log("⚙️ MIGRATING DATA TO v8.1");
                    this.data.meta.version = APP_Config.VERSION;
                    // Ensure maxMarks exists if missing
                    if (!this.data.school.maxMarks) this.data.school.maxMarks = 100;
                    this.save(true);
                }

                console.log(`✅ DATA MOUNTED: ${this.data.students.length} UNITS FOUND.`);
                
            } catch (e) {
                console.error("❌ CORRUPTION DETECTED. RESETTING TO DEFAULTS.");
                this.data = JSON.parse(JSON.stringify(defaultState));
                this.save(true);
            }
        } else {
            console.log("🆕 CREATING NEW DATABASE (SHANTI NIKETAN DEFAULT).");
            this.data = JSON.parse(JSON.stringify(defaultState));
            this.save(true);
        }
    },

    /**
     * Save Data (Debounced)
     */
    save: function(force = false) {
        if (force) {
            this._writeToDisk();
            return;
        }

        // Visual Feedback in Header
        const msg = document.getElementById('system-msg');
        if(msg) {
            msg.innerText = "SAVING...";
            msg.style.color = "var(--warning)";
        }

        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => {
            this._writeToDisk();
        }, APP_Config.SAVE_DELAY);
    },

    _writeToDisk: function() {
        try {
            this.data.meta.lastModified = new Date().toISOString();
            localStorage.setItem(APP_Config.DB_KEY, JSON.stringify(this.data));
            
            const msg = document.getElementById('system-msg');
            if(msg) {
                msg.innerText = "SYSTEM READY";
                msg.style.color = "var(--text-secondary)";
            }
        } catch (e) {
            alert("STORAGE FULL! Please Export and Reset.");
        }
    },

    /**
     * Export Database (Fix for Feedback #8)
     */
    export: function() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().slice(0,10);
        link.download = `RC_DATA_${this.data.school.name.replace(/\s+/g, '_')}_${date}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log("📤 EXPORT COMPLETE");
    },

    /**
     * Import Database (Fix for Feedback #8)
     */
    import: function(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                
                // Basic Validation
                if(!json.students || !json.school) throw new Error("Invalid Format");
                
                this.data = json;
                this.save(true);
                alert("DATABASE RESTORED SUCCESSFULLY! RELOADING...");
                location.reload();
                
            } catch (err) {
                alert("IMPORT FAILED: Invalid JSON File.");
                console.error(err);
            }
        };
        reader.readAsText(file);
    },

    /**
     * Factory Reset (Fix for Feedback #8)
     */
    reset: function() {
        if(confirm("WARNING: ALL DATA WILL BE WIPED.\nAre you sure you want to perform a Factory Reset?")) {
            localStorage.removeItem(APP_Config.DB_KEY);
            location.reload(); // Will reload with Shanti Niketan Defaults
        }
    },

    getTheme: function() {
        return localStorage.getItem(APP_Config.THEME_KEY) || 'light';
    },
    setTheme: function(theme) {
        localStorage.setItem(APP_Config.THEME_KEY, theme);
    },

    /** Centralized exam config — fast, normalized access */
    getExamConfig: function() {
        const e = this.data?.exam || {};
        return {
            marksStructure: e.marksStructure || 'single',
            useAnnualReport: !!e.useAnnualReport,
            annualExams: Array.isArray(e.annualExams) ? e.annualExams : [],
            name: e.name || 'ANNUAL EXAMINATION',
            session: e.session || '2025-2026'
        };
    },

    /** Max marks with fallback */
    getMaxMarks: function() {
        const v = parseInt(this.data?.school?.maxMarks, 10);
        return isNaN(v) || v <= 0 ? 100 : v;
    }
};