// console.log(gsap)
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')


canvas.width = innerWidth
canvas.height = innerHeight

const scoreEl = document.querySelector('#scoreEl')
const startGameBtn = document.querySelector('#startGameBtn')
const modelEl = document.querySelector('#modelEl')
const endScoreEl = document.querySelector("#endScoreEl")


class Player {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
    }

    draw() {
        c.beginPath()
        c.arc( this.x, this.y, this.radius, 0, Math.PI * 2, true )
        c.fillStyle = this.color
        c.fill()
    }
}

class Projectile {
    constructor(x,y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        c.beginPath()
        c.arc( this.x, this.y, this.radius, 0, Math.PI * 2, false )
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
        this.draw()
    }
}
class Enemy {
    constructor(x,y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        c.beginPath()
        c.arc( this.x, this.y, this.radius, 0, Math.PI * 2, false )
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}
//to slow down the velocity 
const friction = 0.97
class Particle {
    constructor(x,y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1
    }

    draw() {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc( this.x, this.y, this.radius, 0, Math.PI * 2, false )
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update() {
        this.draw()
        this.velocity.x *= friction//to slow the velocity
        this.velocity.y *= friction//the reduce to the velocity before adding to the positin
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
        this.alpha -= 0.01
    }

}

const x = canvas.width/2
const y = canvas.height/2

let player = new Player(x, y, 10, 'white')
let projectiles = []
let enemies = []
let particles = []


function init() {
    
    player = new Player(x, y, 10, 'white')
    projectiles = []
    enemies = []
    particles = []
    score = 0
    scoreEl.innerHTML = score
    endScoreEl.innerHTML = score
    
}



function spawnEnemies() {
    setInterval(() => {
        const radius = Math.random() * (30 - 7) + 7
        let x
        let y
        if (Math.random() < 0.5) {
            //spawn enemies from right or left
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
            y = Math.random() * canvas.height
            
        } else { 
            //spawn enemies from top or bottom
            x = Math.random() * canvas.width
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
        }

        const color =`hsl(${Math.random() * 360}, 50%, 50%)`
        const angle = Math.atan2(
          (canvas.height/2)-y,
          (canvas.width/2 )-x
            )
        const velocity = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            } 
        enemies.push(new Enemy(x, y, radius, color, velocity))
    }, 1000)
}

let animateID
let score = 0
function animate() {
    animationId = requestAnimationFrame(animate)

    // draws a rectangle over the previously drawn object
    c.fillStyle = "rgba(0,0,0,0.08)"
    c.fillRect(0, 0, canvas.width, canvas.height)
    player.draw()

    //draw and update particle
    particles.forEach((particle,parindex) => {
        if (particle.alpha <=0) {
            particles.splice(parindex, 1)
        } else {
            particle.update()
        }
    })
    //Loop through all projectile
    projectiles.forEach((projectile, pindex) => {

        //update each projectiles location
        projectile.update()
        
        //to remove projectile that are off screen
        if (projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height) {
            //remove projectile without flashing
            setTimeout(() => {
                projectiles.splice(pindex, 1)
               // console.log(projectiles)
            }, 0);
        }})

    enemies.forEach((enemy, eindex) => {
        enemy.update()

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)

        //end game
        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId)
            endScoreEl.innerHTML = score
            modelEl.style.display = 'flex'
        }

        projectiles.forEach((projectile, pindex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y -enemy.y)
            //detecting projectile collision
            if (dist - enemy.radius - projectile.radius < 1) {

                //explosion
                for (let i = 0; i < enemy.radius * 2; i++ ) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, {
                        x: (Math.random() -0.5) * (Math.random() * 8) ,
                        y: (Math.random() -0.5) * (Math.random() * 8)
                    }))
                }

                //check for for shrink or kill
                if (enemy.radius -10 > 5) {

                    //increase our score
                    score += 100
                    scoreEl.innerHTML = score

                    //using tween( transition to ) to smaller radius
                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    })
                    setTimeout(() => {
                        //removes enemy and projectiles
                        projectiles.splice(pindex, 1)
                    }, 0)
                } else {
                    //remove from scene altogether

                    //increase our score
                    score += 250
                    scoreEl.innerHTML = score

                    setTimeout(() => {
                        //removes enemy and projectiles
                        enemies.splice(eindex, 1)
                        projectiles.splice(pindex, 1)
    
                    }, 0)
                }
           }
        })
    })
}
 
addEventListener('click', (event) => {
   
    const angle = Math.atan2(
        event.clientY - canvas.height / 2,
        event.clientX - canvas.width / 2
    )
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }  
    
    projectiles.push(
        new Projectile(
            canvas.width/2, 
            canvas.height/2,
            5,
            'white', 
           velocity
        )
        )
    })

startGameBtn.addEventListener('click',
    () => {
        init()
        animate() 
        spawnEnemies()
        modelEl.style.display = 'none'
    }
)


//gsap is the goto library for animation






