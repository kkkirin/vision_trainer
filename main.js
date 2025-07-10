        class VisionTrainer {
            constructor() {
                this.sessionTime = 120; // 2分
                this.counter = this.sessionTime;
                this.running = false;
                this.sessionDone = false;
                this.speed = 1; // 0: slow, 1: normal, 2: fast
                this.speeds = [0.5, 2.5, 4.5];
                this.digitSpeeds = [2000, 1500, 1000];
                this.waitingSignal = false;
                this.signalTime = 0;
                this.reactionTimes = [];
                this.failCount = 0;
                this.canvasSize = { width: 420, height: 240 };
                this.dotRadius = 30;
                this.largeDotRadius = 40;
                this.maxReactionTime = 500;
                
                this.initElements();
                this.initEventListeners();
                
                // 初期表示
                const mins = Math.floor(this.counter / 60);
                const secs = this.counter % 60;
                this.timerEl.textContent = `Time: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                this.resultEl.textContent = 'Spaceキーで反応してください';
                
                this.startDigitUpdate();
                this.positionDot();
                
                // ウィンドウリサイズ対応
                window.addEventListener('resize', () => this.updateCanvasSize());
            }
            
            initElements() {
                this.timerEl = document.getElementById('timer');
                this.resultEl = document.getElementById('result');
                this.canvasContainer = document.getElementById('canvasContainer');
                this.dot = document.getElementById('dot');
                this.startBtn = document.getElementById('startBtn');
                
                // 珠の初期位置
                this.dotPosition = {
                    x: this.canvasSize.width / 2,
                    y: this.canvasSize.height / 2
                };
                this.dotVelocity = { x: this.speeds[this.speed], y: this.speeds[this.speed] };
                this.currentRadius = this.dotRadius;
                
                // キャンバスサイズを画面全体に設定
                this.updateCanvasSize();
            }
            
            initEventListeners() {
                this.startBtn.addEventListener('click', () => this.toggle());
                
                // 速度ボタン
                document.getElementById('slowBtn').addEventListener('click', () => this.setSpeed(0));
                document.getElementById('normalBtn').addEventListener('click', () => this.setSpeed(1));
                document.getElementById('fastBtn').addEventListener('click', () => this.setSpeed(2));
                
                
                // ヒストリー
                document.getElementById('historyBtn').addEventListener('click', () => this.showHistory());
                
                // キーボード
                document.addEventListener('keydown', (e) => {
                    if (e.code === 'Space') {
                        e.preventDefault();
                        this.onSpace();
                    }
                });
            }
            
            toggle() {
                if (this.sessionDone) {
                    this.resetSession();
                    return;
                }
                
                this.running = !this.running;
                this.startBtn.textContent = this.running ? '❚❚ Pause' : '▶ Start';
                
                if (this.running) {
                    if (this.counter === this.sessionTime) {
                        // 新しいセッション開始
                        this.startTimer();
                        this.startMovement();
                        this.scheduleSignal();
                    } else {
                        // 一時停止から再開
                        this.resumeTimer();
                        this.startMovement();
                        if (!this.waitingSignal) {
                            this.scheduleSignal();
                        }
                    }
                }
            }
            
            resumeTimer() {
                const timerUpdate = () => {
                    if (!this.running) return;
                    
                    if (this.counter <= 0) {
                        this.endSession();
                        return;
                    }
                    
                    const mins = Math.floor(this.counter / 60);
                    const secs = this.counter % 60;
                    this.timerEl.textContent = `Time: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    
                    this.counter--;
                    setTimeout(timerUpdate, 1000);
                };
                timerUpdate();
            }
            
            setSpeed(speedIndex) {
                this.speed = speedIndex;
                const baseSpeed = this.speeds[speedIndex];
                this.dotVelocity.x = this.dotVelocity.x > 0 ? baseSpeed : -baseSpeed;
                this.dotVelocity.y = this.dotVelocity.y > 0 ? baseSpeed : -baseSpeed;
                
                // 数字更新速度も変更
                this.restartDigitUpdate();
                
                // ボタンの状態更新
                document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
                document.getElementById(['slowBtn', 'normalBtn', 'fastBtn'][speedIndex]).classList.add('active');
            }
            
            startTimer() {
                const timerUpdate = () => {
                    if (!this.running) return;
                    
                    if (this.counter <= 0) {
                        this.endSession();
                        return;
                    }
                    
                    const mins = Math.floor(this.counter / 60);
                    const secs = this.counter % 60;
                    this.timerEl.textContent = `Time: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    
                    this.counter--;
                    setTimeout(timerUpdate, 1000);
                };
                timerUpdate();
            }
            
            startMovement() {
                const moveUpdate = () => {
                    if (!this.running) return;
                    
                    this.dotPosition.x += this.dotVelocity.x;
                    this.dotPosition.y += this.dotVelocity.y;
                    
                    // 境界チェック（フッター分を考慮）
                    if (this.dotPosition.x - this.currentRadius <= 0 || this.dotPosition.x + this.currentRadius >= this.canvasSize.width) {
                        this.dotVelocity.x *= -1;
                        // 境界内に戻す
                        if (this.dotPosition.x - this.currentRadius <= 0) {
                            this.dotPosition.x = this.currentRadius;
                        }
                        if (this.dotPosition.x + this.currentRadius >= this.canvasSize.width) {
                            this.dotPosition.x = this.canvasSize.width - this.currentRadius;
                        }
                    }
                    if (this.dotPosition.y - this.currentRadius <= 0 || this.dotPosition.y + this.currentRadius >= this.canvasSize.height) {
                        this.dotVelocity.y *= -1;
                        // 境界内に戻す
                        if (this.dotPosition.y - this.currentRadius <= 0) {
                            this.dotPosition.y = this.currentRadius;
                        }
                        if (this.dotPosition.y + this.currentRadius >= this.canvasSize.height) {
                            this.dotPosition.y = this.canvasSize.height - this.currentRadius;
                        }
                    }
                    
                    this.positionDot();
                    
                    if (this.running) {
                        requestAnimationFrame(moveUpdate);
                    }
                };
                moveUpdate();
            }
            
            positionDot() {
                this.dot.style.left = (this.dotPosition.x - this.currentRadius) + 'px';
                this.dot.style.top = (this.dotPosition.y - this.currentRadius) + 'px';
            }
            
            startDigitUpdate() {
                if (this.digitInterval) {
                    clearInterval(this.digitInterval);
                }
                
                this.digitInterval = setInterval(() => {
                    if (!this.sessionDone) {
                        this.dot.textContent = Math.floor(Math.random() * 10);
                    }
                }, this.digitSpeeds[this.speed]);
            }
            
            restartDigitUpdate() {
                this.startDigitUpdate();
            }
            
            scheduleSignal() {
                if (!this.running) return;
                
                const delay = Math.random() * 2000 + 1000; // 1-3秒
                setTimeout(() => this.fireSignal(), delay);
            }
            
            fireSignal() {
                if (!this.running) return;
                
                this.dot.classList.add('signal');
                this.waitingSignal = true;
                this.signalTime = performance.now();
            }
            
            onSpace() {
                if (this.sessionDone || !this.waitingSignal) return;
                
                const reactionTime = performance.now() - this.signalTime;
                const frames = Math.floor(reactionTime * 60 / 1000);
                
                if (reactionTime > this.maxReactionTime) {
                    this.failCount++;
                } else {
                    this.reactionTimes.push(reactionTime);
                }
                
                const rtText = reactionTime <= this.maxReactionTime ? `${Math.round(reactionTime)} ms, ${frames} f` : '';
                this.resultEl.textContent = `RT: ${rtText}    Fail: ${this.failCount}`;
                
                this.dot.classList.remove('signal');
                this.waitingSignal = false;
                this.scheduleSignal();
            }
            
            endSession() {
                this.running = false;
                this.sessionDone = true;
                this.startBtn.textContent = '▶ Reset';
                
                // 数字更新を停止
                if (this.digitInterval) {
                    clearInterval(this.digitInterval);
                }
                
                if (this.reactionTimes.length > 0) {
                    const avgMs = this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length;
                    const avgFps = 1000 / avgMs;
                    const avgFrames = Math.floor(avgMs * 60 / 1000);
                    
                    this.resultEl.textContent = `2分終了 平均 FPS: ${avgFps.toFixed(1)}, AvgFrames: ${avgFrames}f (${this.reactionTimes.length} 回), Fail: ${this.failCount}`;
                } else {
                    this.resultEl.textContent = `2分終了 成功0回, Fail: ${this.failCount}`;
                }
                
                this.saveRecord();
            }
            
            resetSession() {
                this.running = false;
                this.sessionDone = false;
                this.counter = this.sessionTime;
                this.waitingSignal = false;
                this.reactionTimes = [];
                this.failCount = 0;
                this.startBtn.textContent = '▶ Start';
                this.dot.classList.remove('signal');
                
                // タイマー表示リセット
                const mins = Math.floor(this.counter / 60);
                const secs = this.counter % 60;
                this.timerEl.textContent = `Time: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                this.resultEl.textContent = 'Spaceキーで反応してください';
                
                // 珠を中央に戻す
                this.dotPosition.x = this.canvasSize.width / 2;
                this.dotPosition.y = this.canvasSize.height / 2;
                this.positionDot();
                
                // 数字更新を再開
                this.startDigitUpdate();
            }
            
            saveRecord() {
                const now = new Date().toLocaleString('ja-JP');
                const avgMs = this.reactionTimes.length > 0 ? this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length : 0;
                const avgFps = avgMs > 0 ? 1000 / avgMs : 0;
                const avgFrames = avgMs > 0 ? Math.floor(avgMs * 60 / 1000) : 0;
                
                const record = {
                    datetime: now,
                    averageFps: avgFps.toFixed(1),
                    averageFrames: avgFrames,
                    count: this.reactionTimes.length,
                    failures: this.failCount
                };
                
                let records = JSON.parse(localStorage.getItem('visionTrainerRecords') || '[]');
                records.push(record);
                localStorage.setItem('visionTrainerRecords', JSON.stringify(records));
            }
            
            
            updateCanvasSize() {
                // 通常時（UIパネルとフッターを除いた全画面）
                this.canvasSize.width = window.innerWidth;
                this.canvasSize.height = window.innerHeight - 90; // UIパネル+フッター分を引く
                this.currentRadius = this.dotRadius;
                
                // 珠の位置を中央に調整（境界内に確実に配置）
                this.dotPosition.x = Math.max(this.currentRadius, Math.min(this.canvasSize.width - this.currentRadius, this.canvasSize.width / 2));
                this.dotPosition.y = Math.max(this.currentRadius, Math.min(this.canvasSize.height - this.currentRadius, this.canvasSize.height / 2));
                this.positionDot();
            }
            
            showHistory() {
                const records = JSON.parse(localStorage.getItem('visionTrainerRecords') || '[]');
                
                // ヒストリーウィンドウの作成
                const historyWindow = document.createElement('div');
                historyWindow.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 80%;
                    max-width: 600px;
                    height: 70%;
                    background-color: #333;
                    border: 2px solid #666;
                    border-radius: 10px;
                    z-index: 10000;
                    padding: 20px;
                    box-sizing: border-box;
                    color: white;
                    font-family: Arial, sans-serif;
                `;
                
                // ヘッダー
                const header = document.createElement('div');
                header.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #666;
                    padding-bottom: 10px;
                `;
                
                const title = document.createElement('h2');
                title.textContent = 'Vision Trainer 履歴';
                title.style.margin = '0';
                title.style.color = '#6cf';
                
                const closeBtn = document.createElement('button');
                closeBtn.textContent = '×';
                closeBtn.style.cssText = `
                    background: #f44;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: bold;
                `;
                closeBtn.addEventListener('click', () => {
                    document.body.removeChild(overlay);
                    document.body.removeChild(historyWindow);
                });
                
                header.appendChild(title);
                header.appendChild(closeBtn);
                
                // 履歴表示エリア
                const historyContent = document.createElement('div');
                historyContent.style.cssText = `
                    height: calc(100% - 80px);
                    overflow-y: auto;
                    padding: 10px;
                    background-color: #222;
                    border-radius: 5px;
                `;
                
                if (records.length === 0) {
                    historyContent.innerHTML = '<p style="text-align: center; color: #bbb;">まだ記録がありません</p>';
                } else {
                    // 最新の5件を表示
                    let historyHtml = '<div style="color: white; font-size: 14px;">';
                    records.slice(-5).reverse().forEach((record, index) => {
                        historyHtml += `
                            <div style="background-color: ${index % 2 === 0 ? '#333' : '#2a2a2a'}; padding: 10px; margin: 5px 0; border-radius: 5px;">
                                <div style="font-weight: bold; color: #6cf;">${record.datetime}</div>
                                <div>平均FPS: ${record.averageFps || '-'} | 平均フレーム: ${record.averageFrames || '-'}</div>
                                <div>成功: ${record.count}回 | 失敗: ${record.failures}回</div>
                            </div>
                        `;
                    });
                    historyHtml += '</div>';
                    
                    // クリアボタン
                    const clearBtn = document.createElement('button');
                    clearBtn.textContent = '履歴をクリア';
                    clearBtn.style.cssText = `
                        margin-top: 15px;
                        padding: 8px 15px;
                        background-color: #f44;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    `;
                    clearBtn.addEventListener('click', () => {
                        if (confirm('本当に履歴をすべて削除しますか？')) {
                            localStorage.removeItem('visionTrainerRecords');
                            document.body.removeChild(overlay);
                            document.body.removeChild(historyWindow);
                        }
                    });
                    
                    historyContent.innerHTML = historyHtml;
                    historyContent.appendChild(clearBtn);
                }
                
                historyWindow.appendChild(header);
                historyWindow.appendChild(historyContent);
                document.body.appendChild(historyWindow);
                
                // 背景オーバーレイ
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.7);
                    z-index: 9999;
                `;
                overlay.addEventListener('click', () => {
                    document.body.removeChild(overlay);
                    document.body.removeChild(historyWindow);
                });
                document.body.insertBefore(overlay, historyWindow);
            }
        }
        
        // アプリケーション開始
        window.addEventListener('DOMContentLoaded', () => {
            new VisionTrainer();
        });
