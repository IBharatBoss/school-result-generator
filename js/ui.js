/**
 * RC GEN PRO v8.1 - UI CONTROLLER (HOTFIX)
 * Fix: Restored setupSearch function to resolve crash.
 */

'use strict';

const UI = {
    chartInstance: null,

    /**
     * 1. SYSTEM BOOT SEQUENCE
     */
    init: function() {
        console.log("%c 🎮 UI SYSTEMS ENGAGED v8.1", "color: #10B981");
        
        // Initial Render
        this.renderDashboard();
        this.renderGridHeaders();
        this.renderGridBody();
        this.renderGrading();
        this.updateSettingsUI();
        
        // Event Listeners
        this.setupNavigation();
        this.setupGlobalEvents();
        this.setupSearch();          // This function is now restored below
        this.setupGridNavigation(); 
        
        // Theme Init
        this.applyTheme(State.getTheme());
    },

    // =============================================================
    // 2. NAVIGATION & VIEW CONTROL
    // =============================================================
    setupNavigation: function() {
        const navItems = document.querySelectorAll('.nav-item[data-view]');
        const views = document.querySelectorAll('.view');

        navItems.forEach(btn => {
            btn.addEventListener('click', () => {
                navItems.forEach(n => n.classList.remove('active'));
                views.forEach(v => v.classList.remove('active'));

                btn.classList.add('active');
                const viewId = btn.getAttribute('data-view');
                document.getElementById(viewId).classList.add('active');

                if (viewId === 'view-dashboard') this.renderDashboard();
                if (viewId === 'view-analytics') this.renderAnalytics();
                if (viewId === 'view-print') this.renderPrintPreview();
            });
        });
    },

    // =============================================================
    // 3. SEARCH & EXCEL NAVIGATION
    // =============================================================
    
    // FIXED: Function restored to prevent crash
    setupSearch: function() {
        const input = document.getElementById('student-search-input');
        if (input) {
            input.addEventListener('input', (e) => {
                this.renderGridBody(e.target.value);
            });
        }
    },

    setupGridNavigation: function() {
        document.addEventListener('keydown', (e) => {
            if (!e.target.classList.contains('cell-input')) return;

            const input = e.target;
            const td = input.closest('td');
            const tr = td.closest('tr');
            
            const colIndex = Array.from(tr.children).indexOf(td);
            const rowIndex = Array.from(tr.parentElement.children).indexOf(tr);
            
            let nextInput = null;

            if (e.key === 'ArrowRight') {
                const nextTd = tr.children[colIndex + 1];
                if (nextTd) nextInput = nextTd.querySelector('.cell-input');
            }
            else if (e.key === 'ArrowLeft') {
                const prevTd = tr.children[colIndex - 1];
                if (prevTd) nextInput = prevTd.querySelector('.cell-input');
            }
            else if (e.key === 'ArrowDown') {
                const nextTr = tr.parentElement.children[rowIndex + 1];
                if (nextTr) nextInput = nextTr.children[colIndex].querySelector('.cell-input');
            }
            else if (e.key === 'ArrowUp') {
                const prevTr = tr.parentElement.children[rowIndex - 1];
                if (prevTr) nextInput = prevTr.children[colIndex].querySelector('.cell-input');
            }

            if (nextInput) {
                e.preventDefault();
                nextInput.focus();
                nextInput.select();
            }
        });
    },

    // =============================================================
    // 4. DATA REGISTRY
    // =============================================================
    renderGridHeaders: function() {
        const row = document.getElementById('grid-header-row');
        const subRow = document.getElementById('grid-header-sub-row');
        if (!row) return;

        const mode = State.getExamConfig().marksStructure;
        const n = mode === 'oralWrittenPractical' ? 3 : (mode === 'oralWritten' ? 2 : 1);
        const comps = mode === 'oralWrittenPractical' ? ['O', 'W', 'P'] : (mode === 'oralWritten' ? ['O', 'W'] : null);

        let html = `<th style="width:80px">ROLL ID</th><th style="width:200px">NAME</th><th style="width:180px">FATHER NAME</th>`;
        State.data.subjects.forEach((sub, i) => {
            if (n === 1) {
                html += `<th contenteditable="true" class="editable-head" onblur="UI.renameSubject(${i}, this.innerText)">${sub}</th>`;
            } else {
                html += `<th colspan="${n}" contenteditable="true" class="editable-head" onblur="UI.renameSubject(${i}, this.innerText)">${sub}</th>`;
            }
        });
        html += `<th style="width:100px" title="Days Attended">ATTENDANCE</th><th style="width:50px">DEL</th>`;
        row.innerHTML = html;

        if (subRow && comps) {
            subRow.style.display = '';
            let subHtml = '<th></th><th></th><th></th>';
            State.data.subjects.forEach(() => {
                comps.forEach(c => { subHtml += `<th class="sub-head">${c}</th>`; });
            });
            subHtml += '<th></th><th></th>';
            subRow.innerHTML = subHtml;
        } else if (subRow) {
            subRow.style.display = 'none';
            subRow.innerHTML = '';
        }
    },

    renderGridBody: function(filterText = '') {
        const tbody = document.getElementById('grid-body');
        const emptyState = document.getElementById('empty-state');
        const table = document.getElementById('main-grid');

        if (!tbody) return;

        const data = State.data.students.filter(s => 
            (s.name || '').toLowerCase().includes((filterText || '').toLowerCase()) || 
            String(s.roll || '').includes(filterText)
        );

        if (data.length === 0 && State.data.students.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        table.style.display = 'table';
        emptyState.style.display = 'none';

        const totalDays = State.data.school.totalWorkingDays;
        const maxMarks = State.getMaxMarks();
        const mode = State.getExamConfig().marksStructure;
        const comps = mode === 'oralWrittenPractical' ? ['o','w','p'] : (mode === 'oralWritten' ? ['o','w'] : null);

        const getVal = (m, c) => {
            if (m == null) return '';
            if (typeof m === 'number') return c ? '' : m;
            const k = c === 'o' ? 'o' : (c === 'w' ? 'w' : 'p');
            return m[k] != null ? m[k] : '';
        };

        tbody.innerHTML = data.map((std, r) => {
            const globalIdx = State.data.students.indexOf(std);
            let marksCells = '';
            (std.marks || []).forEach((m, c) => {
                if (!comps) {
                    const tot = Analytics.getSubjectTotal(m);
                    const passMark = Math.ceil(maxMarks * 0.33);
                    const isFail = tot < passMark;
                    marksCells += `<td><input type="number" class="cell-input ${isFail ? 'fail' : ''}" value="${getVal(m,null)}" onchange="UI.updateMark(${globalIdx}, ${c}, null, this.value)"></td>`;
                } else {
                    comps.forEach(comp => {
                        const v = getVal(m, comp);
                        marksCells += `<td><input type="number" class="cell-input" style="max-width:60px" value="${v}" onchange="UI.updateMark(${globalIdx}, ${c}, '${comp}', this.value)"></td>`;
                    });
                }
            });

            const attCalc = Analytics.calculateAttendance(std.attendance, totalDays);
            const attClass = attCalc.isAnomaly ? 'out-of-bound' : '';
            const attTitle = `${attCalc.label} (${std.attendance}/${totalDays})`;

            return `
                <tr>
                    <td><input class="cell-input" value="${std.roll}" onchange="UI.updateInfo(${globalIdx}, 'roll', this.value)"></td>
                    <td><input class="cell-input" value="${std.name || ''}" onchange="UI.updateInfo(${globalIdx}, 'name', this.value)"></td>
                    <td><input class="cell-input" value="${std.father || ''}" onchange="UI.updateInfo(${globalIdx}, 'father', this.value)"></td>
                    ${marksCells}
                    <td>
                        <input type="number" class="cell-input ${attClass}" value="${std.attendance}" title="${attTitle}"
                               onchange="UI.updateInfo(${globalIdx}, 'attendance', this.value)">
                    </td>
                    <td class="text-center">
                        <button class="btn-icon text-red" onclick="UI.deleteRow(${globalIdx})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    updateInfo: function(index, key, value) {
        State.data.students[index][key] = value;
        State.save();
        if (key === 'attendance') this.renderGridBody(); 
    },

    updateMark: function(r, c, comp, val) {
        const max = State.getMaxMarks();
        let num = parseFloat(val);
        if (isNaN(num)) num = 0;
        if (num > max) { num = max; this.showToast('WARNING', `MAX MARK IS ${max}`, 'error'); }
        if (num < 0) num = 0;

        const mode = State.getExamConfig().marksStructure;
        const m = State.data.students[r].marks[c];

        if (mode === 'single' || !comp) {
            State.data.students[r].marks[c] = num;
        } else {
            const o = m && typeof m === 'object' ? (Number(m.o) || 0) : 0;
            const w = m && typeof m === 'object' ? (Number(m.w) || 0) : 0;
            const p = m && typeof m === 'object' ? (Number(m.p) || 0) : 0;
            if (comp === 'o') State.data.students[r].marks[c] = { o: num, w: w, p: p };
            else if (comp === 'w') State.data.students[r].marks[c] = { o: o, w: num, p: p };
            else State.data.students[r].marks[c] = { o: o, w: w, p: num };
        }
        State.save();

        const input = document.activeElement;
        if (input && input.value != num) input.value = num;
        if (mode === 'single' && input?.classList) {
            const passMark = Math.ceil(max * 0.33);
            const tot = Analytics.getSubjectTotal(State.data.students[r].marks[c]);
            if (tot < passMark) input.classList.add('fail');
            else input.classList.remove('fail');
        }
    },

    renameSubject: function(index, newVal) {
        if(newVal.trim()) {
            State.data.subjects[index] = newVal.trim();
            State.save();
        }
    },

    migrateMarksStructure: function(from, to) {
        const stds = State.data.students;
        const getTot = (m) => {
            if (m == null) return 0;
            if (typeof m === 'number') return Number(m);
            return (Number(m.o ?? m.oral ?? 0) || 0) + (Number(m.w ?? m.written ?? 0) || 0) + (Number(m.p ?? m.practical ?? 0) || 0);
        };
        const toObjs = (m, usePractical) => {
            const v = getTot(m);
            if (usePractical) return { o: 0, w: v, p: 0 };
            return { o: 0, w: v };
        };
        const toSingle = (m) => getTot(m);

        stds.forEach(s => {
            s.marks = s.marks.map((m, i) => {
                if (to === 'single') return toSingle(m);
                return toObjs(m, to === 'oralWrittenPractical');
            });
        });
    },

    deleteRow: function(index) {
        if (confirm("Delete this student?")) {
            State.data.students.splice(index, 1);
            State.save();
            this.renderGridBody();
            this.renderDashboard();
        }
    },

    // =============================================================
    // 5. GLOBAL EVENTS
    // =============================================================
    setupGlobalEvents: function() {
        // Header Backup
        document.getElementById('header-backup-btn')?.addEventListener('click', () => {
            State.export();
            this.showToast('SYSTEM', 'BACKUP DOWNLOADED', 'success');
        });

        // Dashboard Actions
        document.getElementById('qa-add')?.addEventListener('click', () => {
            document.querySelector('[data-view="view-data"]').click();
            setTimeout(() => this.addStudent(), 200);
        });
        document.getElementById('qa-print')?.addEventListener('click', () => {
            document.querySelector('[data-view="view-print"]').click();
        });
        document.getElementById('qa-config')?.addEventListener('click', () => {
            document.querySelector('[data-view="view-settings"]').click();
        });

        // Data Registry Actions
        document.getElementById('btn-add-row')?.addEventListener('click', () => this.addStudent());
        
        document.getElementById('btn-add-col')?.addEventListener('click', () => {
            State.data.subjects.push('SUBJECT');
            const entry = this._newMarkEntry();
            State.data.students.forEach(s => s.marks.push(entry));
            State.save();
            this.renderGridHeaders();
            this.renderGridBody();
        });

        document.getElementById('btn-rem-col')?.addEventListener('click', () => {
            if (State.data.subjects.length > 1) {
                if (confirm("Remove last subject column? Marks will be lost.")) {
                    State.data.subjects.pop();
                    State.data.students.forEach(s => s.marks.pop());
                    State.save();
                    this.renderGridHeaders();
                    this.renderGridBody();
                }
            } else {
                this.showToast('ERROR', 'CANNOT REMOVE LAST SUBJECT', 'error');
            }
        });

        // Grading Rules
        document.getElementById('btn-add-rule')?.addEventListener('click', () => {
            State.data.grading.push({ min: 0, max: 0, grade: '?', desc: '-' });
            State.save();
            this.renderGrading();
        });

        // Settings Inputs
        const bindInput = (id, path, isNum = false) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', (e) => {
                const val = isNum ? (parseInt(e.target.value) || 0) : e.target.value;
                if (path.includes('.')) {
                    const [p1, p2] = path.split('.');
                    State.data[p1][p2] = val;
                }
                State.save();
            });
        };

        bindInput('cfg-school', 'school.name');
        bindInput('cfg-address', 'school.address');
        bindInput('cfg-affiliation', 'school.affiliation');
        bindInput('cfg-logo', 'school.logo');
        bindInput('cfg-working-days', 'school.totalWorkingDays', true);
        bindInput('cfg-max-marks', 'school.maxMarks', true);

        const marksStructSel = document.getElementById('cfg-marks-structure');
        if (marksStructSel) {
            marksStructSel.addEventListener('change', (e) => {
                const next = e.target.value;
                const prev = State.getExamConfig().marksStructure;
                if (next === prev) return;
                State.data.exam.marksStructure = next;
                this.migrateMarksStructure(prev, next);
                State.save(true);
                this.renderGridHeaders();
                this.renderGridBody();
                this.showToast('CONFIG', 'Marks structure updated', 'success');
            });
        }
        document.getElementById('cfg-use-annual')?.addEventListener('change', (e) => {
            State.data.exam.useAnnualReport = !!e.target.checked;
            if (e.target.checked) this.ensureExamMarksForAnnual();
            State.save();
            this.renderPrintPreview();
        });

        // Data Ops
        document.getElementById('btn-export')?.addEventListener('click', () => State.export());
        
        const fileInput = document.getElementById('file-import');
        document.getElementById('btn-import-trigger')?.addEventListener('click', () => fileInput.click());
        fileInput?.addEventListener('change', (e) => {
            if(e.target.files.length > 0) State.import(e.target.files[0]);
        });

        document.getElementById('btn-reset')?.addEventListener('click', () => State.reset());

        // Print Controls
        const refreshPrint = () => this.renderPrintPreview();
        document.getElementById('sel-print-theme')?.addEventListener('change', refreshPrint);
        document.getElementById('chk-watermark')?.addEventListener('change', refreshPrint);
        document.getElementById('chk-page-no')?.addEventListener('change', refreshPrint);
        document.getElementById('chk-timestamp')?.addEventListener('change', refreshPrint);

        document.getElementById('btn-download-pdf')?.addEventListener('click', () => this.downloadBulkPDF());

        // Theme Toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            const cur = State.getTheme();
            const next = cur === 'dark' ? 'light' : 'dark';
            State.setTheme(next);
            this.applyTheme(next);
        });
    },

    // =============================================================
    // 6. RENDERERS
    // =============================================================
    ensureExamMarksForAnnual: function() {
        const n = State.data.subjects.length;
        const mode = State.getExamConfig().marksStructure;
        const zeroEntry = () => {
            if (mode === 'oralWritten') return { o: 0, w: 0 };
            if (mode === 'oralWrittenPractical') return { o: 0, w: 0, p: 0 };
            return 0;
        };
        const zeroMarks = () => Array.from({ length: n }, zeroEntry);
        State.data.students.forEach(std => {
            if (!std.examMarks) {
                std.examMarks = {
                    ut1: { marks: zeroMarks() },
                    ut2: { marks: zeroMarks() },
                    ut3: { marks: zeroMarks() },
                    halfYearly: { marks: zeroMarks() }
                };
            }
        });
    },

    _newMarkEntry: function() {
        const mode = State.getExamConfig().marksStructure;
        if (mode === 'oralWritten') return { o: 0, w: 0 };
        if (mode === 'oralWrittenPractical') return { o: 0, w: 0, p: 0 };
        return 0;
    },

    addStudent: function() {
        const newStd = {
            roll: State.data.students.length + 101,
            name: "",
            father: "",
            marks: Array.from({ length: State.data.subjects.length }, () => this._newMarkEntry()),
            attendance: Math.floor((State.data.school.totalWorkingDays || 280) * 0.75)
        };
        State.data.students.push(newStd);
        State.save();
        this.renderGridBody();
        const wrapper = document.querySelector('.grid-wrapper');
        if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;
    },

    renderGrading: function() {
        const tbody = document.getElementById('grading-body');
        if(!tbody) return;
        tbody.innerHTML = State.data.grading.map((g, i) => `
            <tr>
                <td><input type="number" class="input-tech" value="${g.min}" onchange="State.data.grading[${i}].min=Number(this.value);State.save()"></td>
                <td><input type="number" class="input-tech" value="${g.max}" onchange="State.data.grading[${i}].max=Number(this.value);State.save()"></td>
                <td><input class="input-tech" value="${g.grade}" onchange="State.data.grading[${i}].grade=this.value;State.save()"></td>
                <td><input class="input-tech" value="${g.desc}" onchange="State.data.grading[${i}].desc=this.value;State.save()"></td>
                <td><button class="btn-icon text-red" onclick="State.data.grading.splice(${i},1);UI.renderGrading();State.save()"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join('');
    },

    updateSettingsUI: function() {
        const s = State.data.school;
        const e = State.data.exam || {};
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal('cfg-school', s.name);
        setVal('cfg-address', s.address);
        setVal('cfg-affiliation', s.affiliation);
        setVal('cfg-logo', s.logo);
        setVal('cfg-working-days', s.totalWorkingDays);
        setVal('cfg-max-marks', s.maxMarks || 100);
        setVal('cfg-marks-structure', e.marksStructure || 'single');
        const chk = document.getElementById('cfg-use-annual');
        if (chk) chk.checked = !!e.useAnnualReport;
    },

    applyTheme: function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const icon = document.querySelector('#theme-toggle i');
        if(icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        this.renderDashboard(); 
    },

    renderDashboard: function() {
        const { students, subjects } = State.data;
        const kpis = Analytics.getKPIs(students, subjects);
        const chartData = Analytics.getSubjectStats(students, subjects);

        const txt = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };
        txt('kpi-total', kpis.total);
        txt('kpi-pass-pct', kpis.passRate + '%');
        txt('kpi-fail', kpis.fail);
        txt('kpi-avg', kpis.avgPct + '%');

        this.renderChart(chartData);
    },

    renderChart: function(stats) {
        const ctx = document.getElementById('mainChart');
        if (!ctx) return;
        if (this.chartInstance) this.chartInstance.destroy();

        const isDark = State.getTheme() === 'dark';
        const color = isDark ? '#A1A1AA' : '#52525B';

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stats.map(s => s.label),
                datasets: [{
                    label: 'Avg (%)',
                    data: stats.map(s => s.value),
                    backgroundColor: '#2563EB',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { display: false }, ticks: { color: color } },
                    x: { grid: { display: false }, ticks: { color: color } }
                },
                plugins: { legend: { display: false } }
            }
        });
    },

    renderAnalytics: function() {
        const { students, subjects } = State.data;
        const toppers = Analytics.getLeaderboard(students, subjects, 5);
        document.querySelector('#table-toppers tbody').innerHTML = toppers.map((s, i) => `
            <tr><td>#${i+1}</td><td><b>${s.name}</b></td><td class="text-blue">${s.pct}%</td><td>${s.grade}</td></tr>
        `).join('') || '<tr><td colspan="4">No Data</td></tr>';

        const risk = Analytics.getAtRisk(students, subjects);
        document.querySelector('#table-risk tbody').innerHTML = risk.map(s => `
            <tr><td>${s.roll}</td><td>${s.name}</td><td class="text-red">${s.issue}</td><td>Critical</td></tr>
        `).join('') || '<tr><td colspan="4" class="text-green">All Clear</td></tr>';
    },

    renderPrintPreview: function() {
        const container = document.getElementById('print-preview-container');
        if (!container) return;
        container.innerHTML = '';

        if (State.data.students.length === 0) {
            container.innerHTML = `<div class="empty-state-box"><h3>Data Registry Empty</h3></div>`;
            return;
        }

        const useAnnual = State.getExamConfig().useAnnualReport;
        if (useAnnual) this.ensureExamMarksForAnnual();

        const tpl = document.getElementById(useAnnual ? 'tpl-report-annual' : 'tpl-report-card');
        const theme = document.getElementById('sel-print-theme')?.value || 'modern';
        const config = {
            watermark: document.getElementById('chk-watermark')?.checked,
            pageNo: document.getElementById('chk-page-no')?.checked,
            timestamp: document.getElementById('chk-timestamp')?.checked,
            totalDays: State.data.school.totalWorkingDays,
            maxMarks: State.getMaxMarks()
        };

        const ranked = Analytics.getLeaderboard(State.data.students, State.data.subjects, State.data.students.length);
        const dateStr = new Date().toLocaleString();

        State.data.students.forEach((std) => {
            if (useAnnual) {
                this.renderOneAnnualSheet(container, std, tpl, theme, config, ranked, dateStr);
                return;
            }
            const rankInfo = ranked.find(r => r.name === std.name);
            const rankIndex = ranked.indexOf(rankInfo) + 1;

            const clone = tpl.content.cloneNode(true);
            const sheet = clone.querySelector('.report-sheet');
            
            sheet.classList.add(`theme-${theme}`);
            if(!config.watermark) clone.querySelector('.sheet-watermark').style.display = 'none';
            if(!config.pageNo) clone.querySelector('.header-meta').style.display = 'none';
            
            clone.querySelector('.val-page').textContent = rankIndex;
            clone.querySelector('.val-time').textContent = config.timestamp ? `Generated: ${dateStr}` : '';
            clone.querySelector('.val-school').textContent = State.data.school.name;
            clone.querySelector('.val-address').textContent = State.data.school.address;
            clone.querySelector('.val-aff').textContent = `Affiliation: ${State.data.school.affiliation}`;
            
            const logo = clone.querySelector('.val-logo');
            if (State.data.school.logo) logo.src = State.data.school.logo;
            else logo.style.display = 'none';

            clone.querySelector('.val-roll').textContent = std.roll;
            clone.querySelector('.val-name').textContent = std.name;
            clone.querySelector('.val-father').textContent = std.father;
            
            const attData = Analytics.calculateAttendance(std.attendance, config.totalDays);
            clone.querySelector('.val-att').textContent = `${attData.label} (${std.attendance}/${config.totalDays})`;
            clone.querySelector('.val-rank').textContent = `${rankIndex} / ${State.data.students.length}`;

            const mode = State.getExamConfig().marksStructure;
            const comps = mode === 'oralWrittenPractical' ? ['Oral', 'Written', 'Practical'] : (mode === 'oralWritten' ? ['Oral', 'Written'] : null);
            const theadRow = clone.querySelector('.marks-thead-row');
            const valMarksTh = clone.querySelector('.val-marks-cols');
            if (theadRow && valMarksTh && comps) {
                valMarksTh.outerHTML = comps.map(c => `<th>${c}</th>`).join('') + '<th>Total</th>';
            }

            const tbody = clone.querySelector('.val-tbody');
            let gTotal = 0;
            const passMark = Math.ceil(config.maxMarks * 0.33);

            const getVal = (m, k) => {
                if (m == null) return 0;
                if (typeof m === 'number') return k ? 0 : Number(m);
                return Number(m[k === 'Oral' ? 'o' : (k === 'Written' ? 'w' : 'p')] ?? 0) || 0;
            };

            State.data.subjects.forEach((sub, i) => {
                const m = std.marks[i];
                const tot = Analytics.getSubjectTotal(m);
                gTotal += tot;
                const pct = (tot / config.maxMarks) * 100;
                let cells = '';
                if (!comps) {
                    cells = `<td>${tot}</td>`;
                } else {
                    comps.forEach(c => { cells += `<td>${getVal(m, c)}</td>`; });
                    cells += `<td>${tot}</td>`;
                }
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="text-left">${sub}</td>
                    <td>${config.maxMarks}</td>
                    ${cells}
                    <td>${Analytics._calcGrade(pct)}</td>
                    <td>${tot < passMark ? 'FAIL' : 'PASS'}</td>
                `;
                tbody.appendChild(tr);
            });

            const nCols = comps ? comps.length + 1 : 1;
            const tfTotal = clone.querySelector('.tf-total');
            const valTotalEl = clone.querySelector('.val-total');
            if (valTotalEl) valTotalEl.textContent = `${gTotal} / ${State.data.subjects.length * config.maxMarks}`;
            if (tfTotal && valTotalEl && nCols > 1) {
                valTotalEl.setAttribute('colspan', String(nCols));
            }

            const maxTotal = State.data.subjects.length * config.maxMarks;
            const finalPct = maxTotal > 0 ? (gTotal / maxTotal) * 100 : 0;
            clone.querySelector('.val-pct').textContent = finalPct.toFixed(2) + '%';
            clone.querySelector('.val-grade').textContent = Analytics._calcGrade(finalPct);
            
            let remarks = "PROMOTED TO NEXT CLASS";
            if (finalPct < 33) remarks = "DETAINED: NEEDS IMPROVEMENT";
            else if (finalPct > 90) remarks = "OUTSTANDING PERFORMANCE";
            const remCell = clone.querySelector('.val-rem');
            if (remCell) remCell.textContent = finalPct >= 33 ? 'PASS' : 'FAIL';
            clone.querySelector('.val-overall-rem').textContent = remarks;
            container.appendChild(clone);
        });
    },

    renderOneAnnualSheet: function(container, std, tpl, theme, config, ranked, dateStr) {
        const clone = tpl.content.cloneNode(true);
        const sheet = clone.querySelector('.report-sheet');
        sheet.classList.add(`theme-${theme}`);
        if (!config.watermark) clone.querySelector('.sheet-watermark').style.display = 'none';
        if (!config.pageNo) clone.querySelector('.header-meta').style.display = 'none';

        const rankInfo = ranked.find(r => r.name === std.name);
        const rankIndex = ranked.indexOf(rankInfo) + 1;

        clone.querySelector('.val-page').textContent = rankIndex;
        clone.querySelector('.val-time').textContent = config.timestamp ? `Generated: ${dateStr}` : '';
        clone.querySelector('.val-school').textContent = State.data.school.name;
        clone.querySelector('.val-address').textContent = State.data.school.address;
        clone.querySelector('.val-aff').textContent = `Affiliation: ${State.data.school.affiliation}`;
        const logo = clone.querySelector('.val-logo');
        if (State.data.school.logo) logo.src = State.data.school.logo;
        else logo.style.display = 'none';

        clone.querySelector('.val-exam').textContent = 'ANNUAL REPORT CARD';
        clone.querySelector('.val-session').textContent = State.getExamConfig().session;

        clone.querySelector('.val-roll').textContent = std.roll;
        clone.querySelector('.val-name').textContent = std.name;
        clone.querySelector('.val-father').textContent = std.father || '';
        const attData = Analytics.calculateAttendance(std.attendance, config.totalDays);
        clone.querySelector('.val-att').textContent = `${attData.label} (${std.attendance}/${config.totalDays})`;
        clone.querySelector('.val-rank').textContent = `${rankIndex} / ${State.data.students.length}`;

        const em = std.examMarks || {};
        const maxM = config.maxMarks;
        const subj = State.data.subjects;
        const tbody = clone.querySelector('.val-tbody-annual');
        const tot = { ut1: 0, ut2: 0, ut3: 0, halfYearly: 0, annual: 0 };
        subj.forEach((sub, i) => {
            const u1 = Analytics.getSubjectTotal(em.ut1?.marks?.[i]);
            const u2 = Analytics.getSubjectTotal(em.ut2?.marks?.[i]);
            const u3 = Analytics.getSubjectTotal(em.ut3?.marks?.[i]);
            const hy = Analytics.getSubjectTotal(em.halfYearly?.marks?.[i]);
            const an = Analytics.getSubjectTotal(std.marks?.[i]);
            tot.ut1 += u1; tot.ut2 += u2; tot.ut3 += u3; tot.halfYearly += hy; tot.annual += an;
            const pct = maxM > 0 ? (an / maxM) * 100 : 0;
            const passMark = Math.ceil(maxM * 0.33);
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="text-left">${sub}</td><td>${u1}</td><td>${u2}</td><td>${u3}</td><td>${hy}</td><td>${an}</td><td>${Analytics._calcGrade(pct)}</td><td>${an < passMark ? 'FAIL' : 'PASS'}</td>`;
            tbody.appendChild(tr);
        });
        const maxTotal = subj.length * maxM;
        const finalPct = maxTotal > 0 ? (tot.annual / maxTotal) * 100 : 0;
        clone.querySelector('.val-ut1-tot').textContent = tot.ut1;
        clone.querySelector('.val-ut2-tot').textContent = tot.ut2;
        clone.querySelector('.val-ut3-tot').textContent = tot.ut3;
        clone.querySelector('.val-hy-tot').textContent = tot.halfYearly;
        clone.querySelector('.val-an-tot').textContent = `${tot.annual} / ${maxTotal}`;
        clone.querySelector('.val-grade').textContent = Analytics._calcGrade(finalPct);
        const passFail = finalPct >= 33 ? 'PASS' : 'FAIL';
        const rem = finalPct < 33 ? 'DETAINED: NEEDS IMPROVEMENT' : (finalPct > 90 ? 'OUTSTANDING PERFORMANCE' : 'PROMOTED TO NEXT CLASS');
        const remEl = clone.querySelector('.val-rem');
        if (remEl) remEl.textContent = passFail;
        clone.querySelector('.val-overall-rem').textContent = rem;
        clone.querySelector('.val-pct').textContent = finalPct.toFixed(2) + '%';
        container.appendChild(clone);
    },

    downloadBulkPDF: function() {
        if (State.data.students.length === 0) {
            this.showToast('ERROR', 'No students to export', 'error');
            return;
        }
        const container = document.getElementById('print-preview-container');
        if (!container || !container.querySelectorAll('.report-sheet').length) {
            this.renderPrintPreview();
            setTimeout(() => this.downloadBulkPDF(), 300);
            return;
        }
        if (typeof html2pdf === 'undefined') {
            this.showToast('ERROR', 'PDF library not loaded. Retry or use Print.', 'error');
            return;
        }
        this.showToast('SYSTEM', 'Generating PDF…', 'info');
        const school = (State.data.school.name || 'RC').replace(/\s+/g, '_');
        const date = new Date().toISOString().slice(0, 10);
        const filename = `ReportCards_${school}_${date}.pdf`;
        const opt = {
            margin: 0,
            filename,
            image: { type: 'jpeg', quality: 0.96 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0, scrollX: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: 'css', after: '.report-sheet' }
        };
        html2pdf().set(opt).from(container).save()
            .then(() => this.showToast('SUCCESS', 'PDF downloaded', 'success'))
            .catch((err) => {
                console.error('PDF error:', err);
                this.showToast('ERROR', 'PDF generation failed. Use Print → Save as PDF.', 'error');
            });
    },

    showToast: function(title, msg, type) {
        const wrap = document.getElementById('toast-wrapper');
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.innerHTML = `<i class="fas fa-info-circle"></i> <div><b>${title}</b> ${msg}</div>`;
        wrap.appendChild(t);
        setTimeout(() => { t.classList.add('hiding'); setTimeout(() => t.remove(), 200); }, 3000);
    }
};