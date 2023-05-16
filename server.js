const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const app = express()

const requestLogger = (request, response, next) => {
	console.log('Method', request.method)
	console.log('Path', request.path)
	console.log('Body', request.body)
	console.log('---')
	next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(cors())
app.use(express.json())
app.use(requestLogger)
app.use(morgan('tiny'))

let persons = [
  {
    "id": 1,
    "name": "Levi Ackermann",
    "number": "040-123-4567"
  },
  {
    "id": 2,
    "name": "Mikasa Ackermann",
    "number": "040-123-4567"
  },
  {
    "id": 3,
    "name": "Eren Jaegar",
    "number": "040-123-4567"
  },
  {
    "id": 4,
    "name": "Armin Arlelt",
    "number": "040-123-4567"
  },
  {
    "id": 5,
    "name": "Conny Springer",
    "number": "040-123-4567"
  }
]

// GET requests
app.get('/', (request, response) => {
  response.send(console.log('success!'))
})

app.get('/api/persons', (request, response) => {
  response.send(persons)
})

app.get('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)
  const person = persons.find(person => person.id === id)

  if (person) {
    response.send(person)
  } else {
    response.status(404).end()
  }
})

app.get('/info', (request, response) => {
  const peopleCount = persons.length
  const date = new Date()
  console.log(peopleCount)
  response.send(`Phonebook has info for ${peopleCount} people <br> ${date}`)
})

// POST requests
const generateId = () => {
	const maxId = persons.length > 0
		? Math.max(...persons.map(n => n.id))
		: 0
	return maxId + 1
}

app.post('/api/persons', (request, response) => {
  const body = request.body
  const personExists = persons.find(person => person.name === body.name)

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'name missing'
    })
  } else if (personExists) {
    return response.status(404).json({
      error: 'name must be unique'
    })
  }

  const person = {
    id: generateId(),
    name: body.name,
    number: body.number
  }

  persons = persons.concat(person)
  console.log(persons)

  response.json(person)
})

// DELETE requests
app.delete('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)
  const person = persons.find(person => person.id === id)

  if (person) {
    response.status(204).end()
  } else {
    response.status(404).end()
  }
})

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001
app.listen(PORT)
console.log(`Server running on port: ${PORT}`)