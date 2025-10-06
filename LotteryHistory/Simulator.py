import pygame
import random
import math
import time

# 初始化
pygame.init()
WIDTH, HEIGHT = 1000, 700
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("双色球开奖机模拟")

clock = pygame.time.Clock()
font = pygame.font.SysFont("Arial", 18, bold=True)

# 参数
BALL_RADIUS = 20
NUM_RED = 33
NUM_BLUE = 16
BOWL_RADIUS = 180
LEFT_BOWL_CENTER = (WIDTH // 3, HEIGHT // 3)
RIGHT_BOWL_CENTER = (2 * WIDTH // 3, HEIGHT // 3)
EXIT_X, EXIT_Y = WIDTH // 2, HEIGHT // 2 + BOWL_RADIUS + 50
EXIT_WIDTH, EXIT_HEIGHT = 80, 30
PIPE_Y = HEIGHT - 80
PIPE_START_X = 150
PIPE_GAP = 90

# 出口状态
exit_open = False
exit_anim_frame = 0

# 生成球（沉底）
def create_balls(num, color, center):
    balls = []
    for i in range(num):
        angle = random.uniform(math.pi, 2 * math.pi)  # 只在底部半圆范围
        r = random.uniform(20, BOWL_RADIUS - BALL_RADIUS)
        x = center[0] + r * math.cos(angle)
        y = center[1] + r * math.sin(angle) * 0.4 + BOWL_RADIUS * 0.5  # 压低在底部
        balls.append({
            "x": x, "y": y,
            "vx": random.uniform(-2, 2),
            "vy": random.uniform(-1, 1),
            "color": color,
            "num": i + 1,
            "selected": False,
            "in_pipe": False,
            "target": None
        })
    return balls

red_balls = create_balls(NUM_RED, (220, 50, 50), LEFT_BOWL_CENTER)
blue_balls = create_balls(NUM_BLUE, (50, 50, 220), RIGHT_BOWL_CENTER)

# 状态机
phase = "shake_red"  # shake_red → draw_red → shake_blue → draw_blue → done
drawn_red, drawn_blue = [], []
selected_balls = []
frame_count = 0
last_draw_time = time.time()

# --- 绘制函数 ---
def draw_bowl(center):
    pygame.draw.circle(screen, (180, 180, 180), center, BOWL_RADIUS, 3)

def draw_exit():
    global exit_anim_frame
    if exit_open and exit_anim_frame < 20:
        exit_anim_frame += 1
    elif not exit_open and exit_anim_frame > 0:
        exit_anim_frame -= 1
    alpha = int(150 * (exit_anim_frame / 20))
    s = pygame.Surface((EXIT_WIDTH, EXIT_HEIGHT), pygame.SRCALPHA)
    s.fill((0, 0, 0, alpha))
    screen.blit(s, (EXIT_X - EXIT_WIDTH // 2, EXIT_Y - EXIT_HEIGHT // 2))
    pygame.draw.rect(screen, (100, 100, 100),
                     (EXIT_X - EXIT_WIDTH // 2, EXIT_Y - EXIT_HEIGHT // 2,
                      EXIT_WIDTH, EXIT_HEIGHT), 2)

def draw_result_bar():
    pygame.draw.rect(screen, (200, 200, 200), (PIPE_START_X - 40, PIPE_Y - 40, 7 * PIPE_GAP + 80, 80), 2)

def draw_ball(ball):
    pygame.draw.circle(screen, ball["color"], (int(ball["x"]), int(ball["y"])), BALL_RADIUS)
    text = font.render(str(ball["num"]), True, (255, 255, 255))
    text_rect = text.get_rect(center=(ball["x"], ball["y"]))
    screen.blit(text, text_rect)

# --- 更新函数 ---
def update_ball_motion(ball, center):
    dx, dy = ball["x"] - center[0], ball["y"] - center[1]
    dist = math.sqrt(dx*dx + dy*dy)
    if dist > BOWL_RADIUS - BALL_RADIUS:
        nx, ny = dx / dist, dy / dist
        ball["x"] = center[0] + nx * (BOWL_RADIUS - BALL_RADIUS)
        ball["y"] = center[1] + ny * (BOWL_RADIUS - BALL_RADIUS)
        dot = ball["vx"]*nx + ball["vy"]*ny
        ball["vx"] -= 2 * dot * nx
        ball["vy"] -= 2 * dot * ny
    ball["x"] += ball["vx"]
    ball["y"] += ball["vy"]

def move_to_exit(ball):
    dx, dy = EXIT_X - ball["x"], EXIT_Y - ball["y"]
    dist = math.sqrt(dx*dx + dy*dy)
    if dist > 5:
        ball["x"] += dx * 0.08
        ball["y"] += dy * 0.08
    else:
        ball["in_pipe"] = True
        index = len(drawn_red) + len(drawn_blue) - 1
        ball["target"] = (PIPE_START_X + index * PIPE_GAP, PIPE_Y)

def move_in_pipe(ball):
    tx, ty = ball["target"]
    dx, dy = tx - ball["x"], ty - ball["y"]
    if abs(dx) > 2 or abs(dy) > 2:
        ball["x"] += dx * 0.1
        ball["y"] += dy * 0.1

# --- 主循环 ---
running = True
while running:
    screen.fill((240, 240, 240))
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # 绘制球筐、出口、展示栏
    draw_bowl(LEFT_BOWL_CENTER)
    draw_bowl(RIGHT_BOWL_CENTER)
    draw_exit()
    draw_result_bar()

    # 阶段控制
    if phase == "shake_red":
        for b in red_balls:
            if not b["selected"]:
                update_ball_motion(b, LEFT_BOWL_CENTER)
        if time.time() - last_draw_time > 2 and len(drawn_red) < 6:
            phase = "draw_red"

    elif phase == "draw_red":
        if len(drawn_red) < 6:
            exit_open = True
            candidate = random.choice([b for b in red_balls if not b["selected"]])
            candidate["selected"] = True
            selected_balls.append(candidate)
            drawn_red.append(candidate["num"])
            last_draw_time = time.time()
            phase = "shake_red"
            if len(drawn_red) == 6:
                phase = "shake_blue"
                exit_open = False
                last_draw_time = time.time()

    elif phase == "shake_blue":
        for b in blue_balls:
            if not b["selected"]:
                update_ball_motion(b, RIGHT_BOWL_CENTER)
        if time.time() - last_draw_time > 2 and len(drawn_blue) < 1:
            phase = "draw_blue"

    elif phase == "draw_blue":
        if len(drawn_blue) < 1:
            exit_open = True
            candidate = random.choice([b for b in blue_balls if not b["selected"]])
            candidate["selected"] = True
            selected_balls.append(candidate)
            drawn_blue.append(candidate["num"])
            last_draw_time = time.time()
            phase = "done"
            exit_open = False

    # 更新被选中球
    for b in selected_balls:
        if not b["in_pipe"]:
            move_to_exit(b)
        else:
            move_in_pipe(b)

    # 绘制所有球
    for b in red_balls + blue_balls:
        if not b["selected"] or b in selected_balls:
            draw_ball(b)

    pygame.display.flip()
    clock.tick(60)

pygame.quit()

print("开奖完毕！")
print("红球：", sorted(drawn_red), " 蓝球：", drawn_blue[0])
