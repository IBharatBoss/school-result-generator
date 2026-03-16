/**
 * RC GEN PRO v8.1 - ANALYTICS CORE
 * Phase 6: Mathematics Engine (Variable Max Marks Support)
 * Logic: Dynamic Calculation based on School Settings
 */

'use strict';

const Analytics = {

    /** Get numeric total for a subject mark (single, {o,w}, or {o,w,p}) */
    getSubjectTotal: function(m) {
        if (m == null) return 0;
        if (typeof m === 'number') return Number(m);
        const o = Number(m.o ?? m.oral ?? 0) || 0;
        const w = Number(m.w ?? m.written ?? 0) || 0;
        const p = Number(m.p ?? m.practical ?? 0) || 0;
        return o + w + p;
    },

    /**
     * 1. CORE TELEMETRY (KPIs)
     * Calculates the main stats for the Dashboard HUD
     */
    getKPIs: function(students, subjects) {
        const total = students.length;
        
        // Safety: No Data Streams
        if (total === 0) {
            return {
                total: 0,
                pass: 0,
                fail: 0,
                avgPct: "0.00",
                passRate: "0.0",
                gradeProfile: {}
            };
        }

        let passedCount = 0;
        let totalClassAgg = 0;
        let gradeDist = {};

        const maxPerSub = (typeof State !== 'undefined' && State.getMaxMarks) ? State.getMaxMarks() : 100;
        const totalMax = subjects.length * maxPerSub;
        const passMarks = Math.ceil(maxPerSub * 0.33); // 33% of Max Marks

        students.forEach(std => {
            const obtained = std.marks.reduce((a, m) => a + this.getSubjectTotal(m), 0);
            
            // B. Calculate Percentage (Dynamic)
            const pct = totalMax > 0 ? (obtained / totalMax) * 100 : 0;
            totalClassAgg += pct;

            const hasFailedSub = std.marks.some(m => this.getSubjectTotal(m) < passMarks);
            const isPass = pct >= 33 && !hasFailedSub;

            if (isPass) passedCount++;

            // D. Grade Profile Distribution
            const grade = this._calcGrade(pct);
            gradeDist[grade] = (gradeDist[grade] || 0) + 1;
        });

        return {
            total: total,
            pass: passedCount,
            fail: total - passedCount,
            avgPct: (totalClassAgg / total).toFixed(2),
            passRate: ((passedCount / total) * 100).toFixed(1),
            gradeProfile: gradeDist
        };
    },

    /**
     * 2. SUBJECT PERFORMANCE VECTORS
     * Generates data for the Main Bar Chart
     * Normalizes scores to 0-100 scale for comparison
     */
    getSubjectStats: function(students, subjects) {
        if (students.length === 0 || subjects.length === 0) return [];

        const totals = new Array(subjects.length).fill(0);
        const maxPerSub = (typeof State !== 'undefined' && State.getMaxMarks) ? State.getMaxMarks() : 100;

        students.forEach(std => {
            std.marks.forEach((m, i) => {
                if (i < totals.length) totals[i] += Analytics.getSubjectTotal(m);
            });
        });

        // Compute Averages (Normalized to %)
        return subjects.map((sub, i) => {
            const avgRaw = totals[i] / students.length;
            const avgPct = (avgRaw / maxPerSub) * 100;
            return {
                label: sub,
                value: avgPct.toFixed(1)
            };
        });
    },

    /**
     * 3. ELITE SQUAD (Top Performers)
     */
    getLeaderboard: function(students, subjects, limit = 5) {
        if (students.length === 0) return [];
        
        const maxPerSub = (typeof State !== 'undefined' && State.getMaxMarks) ? State.getMaxMarks() : 100;
        const totalMax = subjects.length * maxPerSub;

        const processed = students.map(std => {
            const total = std.marks.reduce((a, m) => a + this.getSubjectTotal(m), 0);
            const pct = totalMax > 0 ? (total / totalMax) * 100 : 0;
            return {
                name: std.name,
                pct: pct.toFixed(2),
                grade: this._calcGrade(pct),
                raw: pct // internal sort key
            };
        });

        return processed.sort((a, b) => b.raw - a.raw).slice(0, limit);
    },

    /**
     * 4. CRITICAL UNITS (At-Risk Analysis)
     */
    getAtRisk: function(students, subjects) {
        const list = [];
        const maxPerSub = (typeof State !== 'undefined' && State.getMaxMarks) ? State.getMaxMarks() : 100;
        const totalMax = subjects.length * maxPerSub;
        const passMarks = Math.ceil(maxPerSub * 0.33);

        students.forEach(std => {
            const total = std.marks.reduce((a, m) => a + this.getSubjectTotal(m), 0);
            const pct = totalMax > 0 ? (total / totalMax) * 100 : 0;
            const failedSubs = [];
            std.marks.forEach((m, i) => {
                if (this.getSubjectTotal(m) < passMarks) failedSubs.push(subjects[i]);
            });

            if (failedSubs.length > 0 || pct < 40) {
                list.push({
                    roll: std.roll,
                    name: std.name,
                    issue: failedSubs.length > 0 ? `${failedSubs.length} Sub Fail` : 'Low Score',
                    status: 'Critical',
                    pct: pct
                });
            }
        });

        return list.sort((a, b) => a.pct - b.pct);
    },

    /**
     * 5. SMART ATTENDANCE ALGORITHM
     */
    calculateAttendance: function(daysAttended, totalWorkingDays) {
        const attended = parseInt(daysAttended) || 0;
        const total = parseInt(totalWorkingDays) || 1; 

        if (total === 0) return { pct: 0, isAnomaly: false, label: '0%' };

        const pct = (attended / total) * 100;
        const isAnomaly = attended > total;

        return {
            pct: isAnomaly ? 100 : pct.toFixed(1),
            rawPct: pct, 
            isAnomaly: isAnomaly,
            label: isAnomaly ? 'ERR' : `${pct.toFixed(0)}%`
        };
    },

    /**
     * Helper: Internal Grade Calculator
     */
    _calcGrade: function(pct) {
        const rules = (typeof State !== 'undefined' && State.data) 
            ? State.data.grading 
            : [{min:0, grade:'-'}];
            
        for (let r of rules) {
            if (pct >= r.min) return r.grade;
        }
        return 'F';
    }
};