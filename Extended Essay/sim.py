import pygame
import random
import math
import time
from numpy import random as nrandom
import itertools
import matplotlib.pyplot as plt
import matplotlib.cm as cm
import numpy as np


# --- ALGORITHM DATA STRUCTURES (grid, interval, quadtree, rectangle) ---
class Grid: 
    def __init__(self, boundary):
        self.boundary = boundary
        self.particles = []
    def insert(self, particle):
        if self.boundary.intersects_particle(particle):
            self.particles.append(particle)

class Interval:
    def __init__(self, value, particle, is_min):
        self.value = value
        self.particle = particle
        self.is_min = is_min
    def __repr__(self):
        if self.is_min: return "[" + str(self.value)
        return str(self.value) + "]"

class QuadTree:
    def __init__(self, boundary, capacity, show):
        self.boundary = boundary 
        self.capacity = capacity
        self.show = show
        self.subdivided = False
        self.particles = []
        if show:
            pygame.draw.rect(screen, (0, 255, 0), (self.boundary.x - self.boundary.w, self.boundary.y - self.boundary.h, self.boundary.w*2, self.boundary.h*2), 2)
    def insert(self, particle):
        if len(self.particles) < self.capacity:
            self.particles.append(particle)
            return True
        if not self.subdivided: self.subdivide()
        if self.ne.boundary.contains(particle):
            return self.ne.insert(particle)
        if self.nw.boundary.contains(particle):
            return self.nw.insert(particle)
        if self.se.boundary.contains(particle):
            return self.se.insert(particle)
        if self.sw.boundary.contains(particle):
            return self.sw.insert(particle)

    def query(self, region):
        if not self.boundary.intersects(region):
            return []
        found = []
        for particle in self.particles:
            if region.contains(particle):
                found.append(particle)
        if not self.subdivided: return found
        return found + self.ne.query(region) + self.nw.query(region) + self.se.query(region) + self.sw.query(region)

    def subdivide(self):
        x = self.boundary.x
        y = self.boundary.y
        w = self.boundary.w
        h = self.boundary.h

        self.ne = QuadTree(Rectangle(x+w/2, y-h/2, w/2, h/2), self.capacity, self.show)
        self.nw = QuadTree(Rectangle(x-w/2, y-h/2, w/2, h/2), self.capacity, self.show)
        self.se = QuadTree(Rectangle(x+w/2, y+h/2, w/2, h/2), self.capacity, self.show)
        self.sw = QuadTree(Rectangle(x-w/2, y+h/2, w/2, h/2), self.capacity, self.show)

        self.subdivided = True

class Rectangle:
    def __init__(self, x, y, w, h):
        self.x = x
        self.y = y
        self.w = w
        self.h = h
    def contains(self, particle):
        return particle.x > self.x - self.w and particle.x < self.x + self.w and particle.y > self.y - self.h and particle.y < self.y + self.h
    def intersects(self, rectangle):
        return not (rectangle.x - rectangle.w > self.x + self.w or rectangle.x + rectangle.w < self.x - self.w or rectangle.y - rectangle.h > self.y + self.h or rectangle.y + rectangle.h < self.y - self.h)
    def intersects_particle(self, particle):
        particle_distance_x = abs(particle.x - self.x)
        particle_distance_y = abs(particle.y - self.y)
        if particle_distance_x > (self.w + particle.size): return False
        if particle_distance_y > (self.h + particle.size): return False
        if particle_distance_x <= self.w: return True
        if particle_distance_y <= self.h: return True
        corner_distance_squared = (particle_distance_x - self.w)**2 + (particle_distance_y - self.h)**2
        return (corner_distance_squared <= particle.size**2)

# --- BROADPHASE ALGORITHMS ---

def brute_force_collision_detection(particles):
    n = 0
    for i, particle in enumerate(particles):
        for particle2 in particles[i+1:]:
            n += 1
            collide(particle, particle2)
    return n

def quadtree(particles, capacity):
    qt = QuadTree(Rectangle(width/2, height/2, width/2, height/2), capacity, False)
    n = 0
    for particle in particles:
        qt.insert(particle)
        boundary = Rectangle(particle.x, particle.y, particle.size*2, particle.size*2)
        candidates = qt.query(boundary)
        n += (len(candidates) - 1) # candidates includes particle itself
        for candidate in candidates:
            collide(particle, candidate)
    return n


def uniform_grid(particles, p):
    n = 0
    plane = [[Grid(Rectangle(width*(0.5+j)/p, height*(0.5+i)/p, width/(2*p), height/(2*p))) for j in range(0, p)] for i in range(0, p)]
    for particle in particles:
        i = int(particle.y//(height/p))
        j = int(particle.x//(width/p))
        neighbours = [(i-1, j-1), (i-1, j), (i-1, j+1), (i, j-1), (i, j), (i, j+1), (i+1, j-1), (i+1, j), (i+1, j+1)]
        for neighbour in neighbours:
            try:
                grid = plane[neighbour[0]][neighbour[1]]
                grid.insert(particle)
            except IndexError:
                pass
    for i in range(0, p):
        for j in range(0, p):
            for comb in itertools.combinations(plane[i][j].particles, 2):
                n += 1
                collide(comb[0], comb[1])
    return n

def sweep_and_prune(particles):
    intervals = []
    for particle in particles:
        xmin = particle.x - particle.size
        xmax = particle.x + particle.size
        intervals.append(Interval(xmin, particle, True))
        intervals.append(Interval(xmax, particle, False))
    intervals.sort(key = lambda interval: interval.value)
    active_particles = []
    pairsx = set()
    for interval in intervals:
        if interval.is_min:
            active_particles.append(interval.particle)
            continue
        # interval is max
        active_particles.remove(interval.particle)
        for active_particle in active_particles:
            pairsx.add((interval.particle, active_particle))
    for pair in pairsx:
        collide(pair[0], pair[1])
    return len(pairsx)

# --- SIMULATION CODE ---

def collide(p1, p2):
    if p1 == p2:
        return False # particle cannot collide with itself
    dx = p1.x - p2.x
    dy = p1.y - p2.y
    distance = math.hypot(dx, dy)
    if distance > p1.size + p2.size:
        return False # did not collide
    tangent = math.atan2(dy, dx)
    p1.angle = 2*tangent - p1.angle
    p2.angle = 2*tangent - p2.angle
    (p1.speed, p2.speed) = (p2.speed, p1.speed)
    angle = 0.5*math.pi + tangent
    p1.x += math.sin(angle)
    p1.y -= math.cos(angle)
    p2.x -= math.sin(angle)
    p2.y += math.cos(angle)


class Particle:
    def __init__(self, center, angle, size, speed):
        self.x = center[0]
        self.y = center[1] 
        self.size = size
        self.speed = speed
        self.angle = angle
        self.colour = (255, 255, 255)
        self.thickness = 0 # fill
        self.time = time.time()
    def tick(self):
        dt = time.time() - self.time
        self.x += math.sin(self.angle) * self.speed * dt
        self.y -= math.cos(self.angle) * self.speed * dt
        self.wall_bounce()
        pygame.draw.circle(screen, self.colour, (self.x, self.y), self.size, self.thickness)
        self.time = time.time()
    def wall_bounce(self):
        if self.x > width - self.size:
            self.x = 2 * (width - self.size) - self.x
            self.angle = - self.angle
        elif self.x < self.size:
            self.x = 2 * self.size - self.x
            self.angle = - self.angle
        if self.y > height - self.size:
            self.y = 2 * (height - self.size) - self.y
            self.angle = math.pi - self.angle
        elif self.y < self.size:
            self.y = 2 * self.size - self.y
            self.angle = math.pi - self.angle
    def __repr__(self):
        return f"({self.x}, {self.y}, {self.size} px)"


def generator(number, size, x_gaussian_spread, y_gaussian_spread):
    particles = []

    if x_gaussian_spread != 0:
        meanx = width/2
        xs = list(nrandom.normal(loc=meanx, scale=width/x_gaussian_spread, size=number))
    else:
        xs = list(nrandom.uniform(low=size, high=width-size, size=number))

    if y_gaussian_spread != 0:
        meany = height/2
        ys = list(nrandom.normal(loc=meany, scale=height/y_gaussian_spread, size=number))
    else:
        ys = list(nrandom.uniform(low=size, high=height-size, size=number))

    speed = 10
    for i in range(number):
        theta = random.uniform(0, 2*math.pi)
        particles.append(Particle((xs[i], ys[i]), theta, size, speed))
    return particles

class Particles:
    BRUTE_FORCE = "bf"
    SWEEP_AND_PRUNE = "sap"
    QUADTREE = "qt"
    UNIFORM_PARTITIONING = "usp"
    GAUSS_X = "gaussx"
    GAUSS_Y = "gaussy"
    GAUSS = "gauss"
    UNIFORM = "uniform"
    def __init__(self, number, size, tmax, algo, distribution, p, capacity):
        self.number = number
        self.particles = []
        self.tinit = time.time_ns()
        self.tmax = tmax
        self.algo = algo
        self.size = size
        self.distribution = distribution
        self.number_frames = 0
        self.total_time = 0
        self.total_checks = 0
        self.p = p
        self.capacity = capacity
    def generate(self):
        if self.distribution == Particles.GAUSS_X:
            self.particles = generator(self.number, self.size, 10, 0)
        if self.distribution == Particles.GAUSS:
            self.particles = generator(self.number, self.size, 10, 10)
        if self.distribution == Particles.UNIFORM:
            self.particles = generator(self.number, self.size, 0, 0)
        if self.distribution == Particles.GAUSS_Y:
            self.particles = generator(self.number, self.size, 0, 10)
    def tick(self):
        tframeinit = time.time_ns()
        if tframeinit - self.tinit > self.tmax * 10**9:
            return (self.total_checks/self.number_frames, self.total_time/self.number_frames)
        if self.algo == Particles.BRUTE_FORCE: self.total_checks += brute_force_collision_detection(self.particles)
        if self.algo == Particles.SWEEP_AND_PRUNE: self.total_checks += sweep_and_prune(self.particles)
        if self.algo == Particles.QUADTREE : self.total_checks += quadtree(self.particles, self.capacity)
        if self.algo == Particles.UNIFORM_PARTITIONING: self.total_checks += uniform_grid(self.particles, self.p)
        dt = time.time_ns() - tframeinit
        self.total_time += dt
        for particle in self.particles:
            particle.tick()
        self.number_frames += 1

(width, height) = (500, 500)
screen = pygame.display.set_mode((width, height))
pygame.display.flip()
pygame.display.set_caption('Collision Sim')
background_colour = (0, 0, 0)



def run_sim(number, size, algorithm, distribution, p, capacity):
    particles = Particles(number, size, 5, algorithm, distribution, p, capacity)
    particles.generate()
    running = True
    while running:
        screen.fill(background_colour)
        x = particles.tick()
        if x:
            return x
        pygame.display.update()
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
    pygame.quit()

# --- EXPERIMENTS CODE ---

# Experiment 1
def vary_p():
    print("p      t")
    ps = np.arange(6, 30)
    ts = np.zeros(30-6)
    for i, p in enumerate(ps):
        ts[i] = run_sim(1024, 10, Particles.UNIFORM_PARTITIONING, Particles.UNIFORM, p, 0)[1]
        print(f"{p} {ts[i]}")
    plt.plot(ps, ts)
    plt.xlabel("Number of partitions")
    plt.ylabel(f"Average frame period")
    plt.savefig(f"p.png")

# Experiment 2
def vary_capacity():
    print("κ      t")
    capacities = np.arange(1, 20 , 1)
    ts = np.zeros(capacities.size)
    for i, capacity in enumerate(capacities):
        ts[i] = run_sim(1024, 10, Particles.QUADTREE, Particles.UNIFORM, 0, capacity)[1]
        print(f"{capacity} {ts[i]}")
    plt.plot(capacities, ts)
    plt.xlabel("Capacity of Quadtree")
    plt.ylabel(f"Average frame period")
    plt.savefig(f"capacity.png")

# Experiment 3
def optimize_p_n():
    print("n    r   Tavg    p*")
    ns = [4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]
    maxs = []
    for n in ns:
        size = 20
        prev_prev = run_sim(n, size, Particles.UNIFORM_PARTITIONING, Particles.UNIFORM, 1, 0)[1]
        prev = run_sim(n, size, Particles.UNIFORM_PARTITIONING, Particles.UNIFORM, 2, 0)[1]
        i = 3
        while True:
            cur = run_sim(n, size, Particles.UNIFORM_PARTITIONING, Particles.UNIFORM, i, 0)[1]
            if cur > prev and prev_prev > prev:
                # local minima
                print(n, size, prev, i-1)
                maxs.append(i-1)
                break
            prev_prev = prev
            prev = cur
            i += 1
    plt.plot(ns, maxs)
    plt.xscale("log")
    plt.xlabel("Number of particles (n)")
    plt.ylabel("Optimum value of p")
    plt.show()

# Experiment 4
def uniform_dist(size):
    optimum_ps = [2, 2, 3, 3, 7, 8, 11, 15, 17, 21]
    capacity_opt = 5
    numbers = [2**i for i in range(2, 12)]
    alg_results = [["sap"], ["qt"], ["usp"]]
    for i, n in enumerate(numbers):
        for j in range(0, 3):
            alg_results[j].append(run_sim(n, size, alg_results[j][0], Particles.UNIFORM, optimum_ps[i], capacity_opt)[1])
    print(alg_results)
    plt.xlabel("n")
    plt.ylabel("Average frame period")
    plt.xscale("log")
    plt.yscale("log")
    for j in range(0, 3):
        times = alg_results[j][1:]
        name = alg_results[j][0]
        plt.plot(numbers, times, label=name)
    plt.legend(loc="upper left")
    plt.savefig(f"uniform_{size}px.png")

# Experiment 5
def gaussy_dist():
    p = 8
    capacity_opt = 5
    numbers = [2**i for i in range(2, 12)]
    alg_results = [["sap"], ["qt"], ["usp"]]
    for i, n in enumerate(numbers):
        for j in range(0, 3):
            alg_results[j].append(run_sim(n, 10, alg_results[j][0], Particles.GAUSS_Y, p, capacity_opt)[1])
    print(alg_results)
    plt.xlabel("n")
    plt.ylabel("Average frame period")
    plt.xscale("log")
    plt.yscale("log")
    for j in range(0, 3):
        times = alg_results[j][1:]
        name = alg_results[j][0]
        plt.plot(numbers, times, label=name)
    plt.legend(loc="upper left")
    plt.savefig(f"gaussian_y.png")

# Experiment 6
def gaussx_dist():
    p=8
    capacity_opt = 5
    numbers = [2**i for i in range(2, 12)]
    alg_results = [["sap"], ["qt"], ["usp"]]
    for i, n in enumerate(numbers):
        for j in range(0, 3):
            alg_results[j].append(run_sim(n, 10, alg_results[j][0], Particles.GAUSS_X, p, capacity_opt)[1])
    print(alg_results)
    plt.xlabel("n")
    plt.ylabel("Average frame period")
    plt.xscale("log")
    plt.yscale("log")
    for j in range(0, 3):
        times = alg_results[j][1:]
        name = alg_results[j][0]
        plt.plot(numbers, times, label=name)
    plt.legend(loc="upper left")
    plt.savefig(f"gaussian_x.png")

    

# Experiment 1
# vary_p()

# Experiment 2
# vary_capacity()

# Experiment 3
# optimize_p_n()



# Experiment 4
#uniform_dist(3)
#uniform_dist(10)
#uniform_dist(25)

# Experiment 5
#gaussy_dist()

# Experiment 6
# gaussx_dist()

run_sim(40, 20, "sap", Particles.UNIFORM, 1, 1)

pygame.quit()
