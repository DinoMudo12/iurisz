const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// =====================================================
// TAMANHO DA TELA
// =====================================================

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);


// =====================================================
// HUD
// =====================================================

const health1Text = document.getElementById("health1");
const health2Text = document.getElementById("health2");

const scoreText = document.getElementById("score");
const waveText = document.getElementById("wave");
const timeText = document.getElementById("time");

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over");

const finalScore = document.getElementById("finalScore");
const finalTime = document.getElementById("finalTime");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");


// =====================================================
// ESTADO
// =====================================================

let gameRunning = false;

let score = 0;
let wave = 1;
let gameTime = 0;

let enemies = [];
let bullets = [];
let particles = [];

let lastTime = 0;

let enemySpawnTimer = 0;
let waveTimer = 0;

let keys = {};


// =====================================================
// MOUSE
// =====================================================

const mouse = {
    x: 0,
    y: 0,
    down: false
};

canvas.addEventListener("mousemove", event => {

    const rect = canvas.getBoundingClientRect();

    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
});

canvas.addEventListener("mousedown", () => {
    mouse.down = true;
});

window.addEventListener("mouseup", () => {
    mouse.down = false;
});


// =====================================================
// TECLADO
// =====================================================

window.addEventListener("keydown", event => {

    keys[event.key.toLowerCase()] = true;

    if (
        event.key === " " ||
        event.key.startsWith("Arrow")
    ) {
        event.preventDefault();
    }
});

window.addEventListener("keyup", event => {

    keys[event.key.toLowerCase()] = false;
});


// =====================================================
// PLAYER 1
// =====================================================

const player1 = {

    x: 0,
    y: 0,

    radius: 20,

    speed: 300,

    health: 100,

    angle: 0,

    shootCooldown: 0,

    color: "#299cff",

    alive: true
};


// =====================================================
// PLAYER 2
// =====================================================

const player2 = {

    x: 0,
    y: 0,

    radius: 20,

    speed: 300,

    health: 100,

    angle: -Math.PI / 2,

    shootCooldown: 0,

    color: "#36ff73",

    alive: true
};


// =====================================================
// BOTÕES
// =====================================================

startButton.addEventListener("click", startGame);

restartButton.addEventListener("click", startGame);


// =====================================================
// COMEÇAR
// =====================================================

function startGame() {

    gameRunning = true;

    score = 0;
    wave = 1;
    gameTime = 0;

    enemies = [];
    bullets = [];
    particles = [];

    enemySpawnTimer = 0;
    waveTimer = 0;

    // Player 1

    player1.x = canvas.width / 2 - 80;
    player1.y = canvas.height / 2;

    player1.health = 100;
    player1.angle = 0;
    player1.shootCooldown = 0;
    player1.alive = true;

    // Player 2

    player2.x = canvas.width / 2 + 80;
    player2.y = canvas.height / 2;

    player2.health = 100;
    player2.angle = Math.PI;
    player2.shootCooldown = 0;
    player2.alive = true;

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    lastTime = performance.now();

    requestAnimationFrame(gameLoop);
}


// =====================================================
// GAME LOOP
// =====================================================

function gameLoop(timestamp) {

    if (!gameRunning) {
        return;
    }

    let delta =
        (timestamp - lastTime) / 1000;

    delta = Math.min(delta, 0.05);

    lastTime = timestamp;

    update(delta);

    draw();

    requestAnimationFrame(gameLoop);
}


// =====================================================
// UPDATE
// =====================================================

function update(delta) {

    gameTime += delta;

    waveTimer += delta;

    if (waveTimer >= 30) {

        wave++;

        waveTimer = 0;

        healPlayers();
    }

    updatePlayer1(delta);

    updatePlayer2(delta);

    updateBullets(delta);

    updateEnemies(delta);

    updateParticles(delta);

    spawnEnemies(delta);

    updateHUD();

    if (
        !player1.alive &&
        !player2.alive
    ) {
        gameOver();
    }
}


// =====================================================
// PLAYER 1
// =====================================================

function updatePlayer1(delta) {

    if (!player1.alive) {
        return;
    }

    let dx = 0;
    let dy = 0;

    if (keys["w"]) dy--;

    if (keys["s"]) dy++;

    if (keys["a"]) dx--;

    if (keys["d"]) dx++;

    movePlayer(
        player1,
        dx,
        dy,
        delta
    );

    // Mira no mouse

    player1.angle = Math.atan2(
        mouse.y - player1.y,
        mouse.x - player1.x
    );

    player1.shootCooldown -= delta;

    if (
        mouse.down &&
        player1.shootCooldown <= 0
    ) {

        shoot(player1);

        player1.shootCooldown = 0.16;
    }
}


// =====================================================
// PLAYER 2
// =====================================================

function updatePlayer2(delta) {

    if (!player2.alive) {
        return;
    }

    let dx = 0;
    let dy = 0;

    if (keys["arrowup"]) dy--;

    if (keys["arrowdown"]) dy++;

    if (keys["arrowleft"]) dx--;

    if (keys["arrowright"]) dx++;

    movePlayer(
        player2,
        dx,
        dy,
        delta
    );

    // Girar mira

    if (keys["j"]) {

        player2.angle -=
            2.8 * delta;
    }

    if (keys["l"]) {

        player2.angle +=
            2.8 * delta;
    }

    player2.shootCooldown -= delta;

    // Espaço atira

    if (
        keys[" "] &&
        player2.shootCooldown <= 0
    ) {

        shoot(player2);

        player2.shootCooldown = 0.16;
    }
}


// =====================================================
// MOVIMENTO
// =====================================================

function movePlayer(player, dx, dy, delta) {

    if (dx !== 0 || dy !== 0) {

        const length =
            Math.sqrt(dx * dx + dy * dy);

        dx /= length;
        dy /= length;

        player.x +=
            dx * player.speed * delta;

        player.y +=
            dy * player.speed * delta;
    }

    player.x = Math.max(
        player.radius,
        Math.min(
            canvas.width - player.radius,
            player.x
        )
    );

    player.y = Math.max(
        player.radius,
        Math.min(
            canvas.height - player.radius,
            player.y
        )
    );
}


// =====================================================
// TIRO
// =====================================================

function shoot(player) {

    const speed = 750;

    const bullet = {

        x:
            player.x +
            Math.cos(player.angle) * 28,

        y:
            player.y +
            Math.sin(player.angle) * 28,

        vx:
            Math.cos(player.angle) * speed,

        vy:
            Math.sin(player.angle) * speed,

        radius: 5,

        damage: 1,

        color: player.color
    };

    bullets.push(bullet);

    for (let i = 0; i < 4; i++) {

        createParticle(
            bullet.x,
            bullet.y,
            player.color,
            100
        );
    }
}


// =====================================================
// BALAS
// =====================================================

function updateBullets(delta) {

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet = bullets[i];

        bullet.x +=
            bullet.vx * delta;

        bullet.y +=
            bullet.vy * delta;

        if (
            bullet.x < -50 ||
            bullet.x > canvas.width + 50 ||
            bullet.y < -50 ||
            bullet.y > canvas.height + 50
        ) {

            bullets.splice(i, 1);

            continue;
        }

        for (
            let j = enemies.length - 1;
            j >= 0;
            j--
        ) {

            const enemy = enemies[j];

            const distance =
                Math.hypot(
                    bullet.x - enemy.x,
                    bullet.y - enemy.y
                );

            if (
                distance <
                bullet.radius +
                enemy.radius
            ) {

                enemy.health -=
                    bullet.damage;

                bullets.splice(i, 1);

                createHitEffect(
                    bullet.x,
                    bullet.y,
                    enemy.color
                );

                if (enemy.health <= 0) {

                    killEnemy(enemy);

                    enemies.splice(j, 1);
                }

                break;
            }
        }
    }
}


// =====================================================
// CRIAR INIMIGO
// =====================================================

function spawnEnemies(delta) {

    enemySpawnTimer -= delta;

    if (enemySpawnTimer > 0) {
        return;
    }

    enemySpawnTimer =
        Math.max(
            0.25,
            1 - wave * 0.05
        );

    createEnemy();

    if (
        wave >= 5 &&
        Math.random() < 0.25
    ) {
        createEnemy();
    }
}


function createEnemy() {

    let x;
    let y;

    const side =
        Math.floor(Math.random() * 4);

    const margin = 70;

    if (side === 0) {

        x = Math.random() * canvas.width;
        y = -margin;

    } else if (side === 1) {

        x = canvas.width + margin;
        y = Math.random() * canvas.height;

    } else if (side === 2) {

        x = Math.random() * canvas.width;
        y = canvas.height + margin;

    } else {

        x = -margin;
        y = Math.random() * canvas.height;
    }

    const roll = Math.random();

    let enemy;

    if (roll < 0.7) {

        enemy = {

            type: "normal",

            x,
            y,

            radius: 17,

            speed:
                70 + wave * 3,

            health:
                2 + Math.floor(wave / 6),

            damage: 10,

            color: "#e83232"
        };

    } else if (roll < 0.9) {

        enemy = {

            type: "fast",

            x,
            y,

            radius: 12,

            speed:
                120 + wave * 4,

            health: 1,

            damage: 7,

            color: "#ff9d32"
        };

    } else {

        enemy = {

            type: "tank",

            x,
            y,

            radius: 27,

            speed:
                40 + wave * 2,

            health:
                8 + wave,

            damage: 20,

            color: "#9c32ff"
        };
    }

    enemies.push(enemy);
}


// =====================================================
// ATUALIZAR INIMIGOS
// =====================================================

function updateEnemies(delta) {

    for (const enemy of enemies) {

        const target =
            getClosestPlayer(enemy);

        if (!target) {
            continue;
        }

        const dx =
            target.x - enemy.x;

        const dy =
            target.y - enemy.y;

        const distance =
            Math.hypot(dx, dy);

        if (distance > 0) {

            enemy.x +=
                (dx / distance) *
                enemy.speed *
                delta;

            enemy.y +=
                (dy / distance) *
                enemy.speed *
                delta;
        }

        // Ataque

        if (
            distance <
            enemy.radius +
            target.radius
        ) {

            target.health -=
                enemy.damage * delta;

            if (target.health <= 0) {

                target.health = 0;

                target.alive = false;

                createExplosion(
                    target.x,
                    target.y,
                    target.color
                );
            }
        }
    }
}


// =====================================================
// ENCONTRAR PLAYER MAIS PRÓXIMO
// =====================================================

function getClosestPlayer(enemy) {

    let targets = [];

    if (player1.alive) {
        targets.push(player1);
    }

    if (player2.alive) {
        targets.push(player2);
    }

    if (targets.length === 0) {
        return null;
    }

    let closest = targets[0];

    let closestDistance =
        Math.hypot(
            enemy.x - closest.x,
            enemy.y - closest.y
        );

    for (const target of targets) {

        const distance =
            Math.hypot(
                enemy.x - target.x,
                enemy.y - target.y
            );

        if (distance < closestDistance) {

            closest = target;

            closestDistance = distance;
        }
    }

    return closest;
}


// =====================================================
// MATAR INIMIGO
// =====================================================

function killEnemy(enemy) {

    if (enemy.type === "normal") {

        score += 10;

    } else if (enemy.type === "fast") {

        score += 20;

    } else {

        score += 50;
    }

    createExplosion(
        enemy.x,
        enemy.y,
        enemy.color
    );
}


// =====================================================
// CURAR PLAYERS
// =====================================================

function healPlayers() {

    if (player1.alive) {

        player1.health =
            Math.min(
                100,
                player1.health + 15
            );
    }

    if (player2.alive) {

        player2.health =
            Math.min(
                100,
                player2.health + 15
            );
    }

    for (let i = 0; i < 30; i++) {

        createParticle(
            canvas.width / 2,
            canvas.height / 2,
            "#5de1ff",
            200
        );
    }
}


// =====================================================
// PARTÍCULAS
// =====================================================

function createParticle(
    x,
    y,
    color,
    speed
) {

    const angle =
        Math.random() *
        Math.PI *
        2;

    const velocity =
        Math.random() *
        speed;

    particles.push({

        x,
        y,

        vx:
            Math.cos(angle) *
            velocity,

        vy:
            Math.sin(angle) *
            velocity,

        life:
            0.4 +
            Math.random() * 0.5,

        maxLife: 0.9,

        size:
            2 +
            Math.random() * 4,

        color
    });
}


function createHitEffect(x, y, color) {

    for (let i = 0; i < 5; i++) {

        createParticle(
            x,
            y,
            color,
            120
        );
    }
}


function createExplosion(x, y, color) {

    for (let i = 0; i < 18; i++) {

        createParticle(
            x,
            y,
            color,
            220
        );
    }
}


function updateParticles(delta) {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            particles[i];

        particle.x +=
            particle.vx * delta;

        particle.y +=
            particle.vy * delta;

        particle.vx *= 0.96;
        particle.vy *= 0.96;

        particle.life -= delta;

        if (particle.life <= 0) {

            particles.splice(i, 1);
        }
    }
}


// =====================================================
// DESENHAR
// =====================================================

function draw() {

    drawBackground();

    drawGrid();

    drawParticles();

    drawBullets();

    drawEnemies();

    drawPlayer(player1);

    drawPlayer(player2);

    drawCrosshair();
}


// =====================================================
// FUNDO
// =====================================================

function drawBackground() {

    const gradient =
        ctx.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            100,
            canvas.width / 2,
            canvas.height / 2,
            Math.max(
                canvas.width,
                canvas.height
            )
        );

    gradient.addColorStop(
        0,
        "#18252b"
    );

    gradient.addColorStop(
        1,
        "#07090b"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}


// =====================================================
// GRID
// =====================================================

function drawGrid() {

    const gridSize = 50;

    ctx.strokeStyle =
        "rgba(255,255,255,0.035)";

    ctx.lineWidth = 1;

    for (
        let x = 0;
        x < canvas.width;
        x += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);

        ctx.lineTo(
            x,
            canvas.height
        );

        ctx.stroke();
    }

    for (
        let y = 0;
        y < canvas.height;
        y += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);

        ctx.lineTo(
            canvas.width,
            y
        );

        ctx.stroke();
    }
}


// =====================================================
// PLAYER
// =====================================================

function drawPlayer(player) {

    if (!player.alive) {
        return;
    }

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );

    ctx.rotate(player.angle);

    // Sombra

    ctx.beginPath();

    ctx.arc(
        4,
        5,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.5)";

    ctx.fill();

    // Corpo

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        player.color;

    ctx.shadowColor =
        player.color;

    ctx.shadowBlur = 18;

    ctx.fill();

    ctx.shadowBlur = 0;

    // Arma

    ctx.fillStyle = "#ddd";

    ctx.fillRect(
        5,
        -5,
        27,
        10
    );

    // Visor

    ctx.beginPath();

    ctx.arc(
        7,
        -7,
        5,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#fff";

    ctx.fill();

    ctx.restore();
}


// =====================================================
// INIMIGOS
// =====================================================

function drawEnemies() {

    for (const enemy of enemies) {

        ctx.beginPath();

        ctx.arc(
            enemy.x + 4,
            enemy.y + 5,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.5)";

        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            enemy.color;

        ctx.shadowColor =
            enemy.color;

        ctx.shadowBlur = 10;

        ctx.fill();

        ctx.shadowBlur = 0;

        // Olhos

        ctx.fillStyle = "#fff";

        const eye =
            enemy.radius * 0.3;

        ctx.beginPath();

        ctx.arc(
            enemy.x - eye,
            enemy.y - 3,
            3,
            0,
            Math.PI * 2
        );

        ctx.arc(
            enemy.x + eye,
            enemy.y - 3,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


// =====================================================
// BALAS
// =====================================================

function drawBullets() {

    for (const bullet of bullets) {

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            bullet.color;

        ctx.shadowColor =
            bullet.color;

        ctx.shadowBlur = 12;

        ctx.fill();

        ctx.shadowBlur = 0;
    }
}


// =====================================================
// PARTÍCULAS
// =====================================================

function drawParticles() {

    for (const particle of particles) {

        const alpha =
            Math.max(
                0,
                particle.life /
                particle.maxLife
            );

        ctx.globalAlpha = alpha;

        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            particle.color;

        ctx.fill();

        ctx.globalAlpha = 1;
    }
}


// =====================================================
// MIRA DO PLAYER 1
// =====================================================

function drawCrosshair() {

    if (
        !gameRunning ||
        !player1.alive
    ) {
        return;
    }

    ctx.strokeStyle =
        "rgba(255,255,255,0.8)";

    ctx.lineWidth = 2;

    const size = 10;

    ctx.beginPath();

    ctx.moveTo(
        mouse.x - size,
        mouse.y
    );

    ctx.lineTo(
        mouse.x + size,
        mouse.y
    );

    ctx.moveTo(
        mouse.x,
        mouse.y - size
    );

    ctx.lineTo(
        mouse.x,
        mouse.y + size
    );

    ctx.stroke();
}


// =====================================================
// HUD
// =====================================================

function updateHUD() {

    health1Text.textContent =
        Math.ceil(
            Math.max(
                0,
                player1.health
            )
        );

    health2Text.textContent =
        Math.ceil(
            Math.max(
                0,
                player2.health
            )
        );

    scoreText.textContent = score;

    waveText.textContent = wave;

    timeText.textContent =
        Math.floor(gameTime);
}


// =====================================================
// GAME OVER
// =====================================================

function gameOver() {

    gameRunning = false;

    finalScore.textContent =
        score;

    finalTime.textContent =
        Math.floor(gameTime);

    gameOverScreen.classList.remove(
        "hidden"
    );
}


// =====================================================
// PRIMEIRO DESENHO
// =====================================================

draw();