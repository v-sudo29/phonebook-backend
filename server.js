require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const mongoose = require('mongoose')
const Person = require('./models/person')
const person = require('./models/person')

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

const url = process.env.MONGODB_URI

mongoose.set('strictQuery', false)
mongoose.connect(url)

// GET requests
app.get('/', (request, response) => {
  response.send(console.log('success!'))
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })

  Person.find({name: 'Con Springer'})
    .then(result => {
      if (result.length === 0) {
        console.log('No one found')
      } else {
        console.log(result)
      }
    })
    .catch(error => {
      console.log(error)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
  .then(person => {
    if (person) {
      response.json(person)
    } else {
      response.status(404).end()
    }
  })
  .catch(error => next(error))
})

app.get('/info', (request, response) => {
  let peopleCount = 0
  const date = new Date()

  Person.find({}).then(persons => {
    peopleCount = persons.length
    response.send(`Phonebook has info for ${peopleCount} people <br> ${date}`)
  })
})

// POST requests
app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'field is missing'
    })
  }

  // Check if person's name is in db
  Person.find({name: `${body.name}`})
  .then(result => {
    if (result.length === 0) {

      // Create new person and add to db
      const person = new Person({
        name: body.name,
        number: body.number
      })

      person.save().then(savedPerson => {
        response.json(savedPerson)
      })
    } else {

      // Update current person in db
      Person.findOneAndUpdate({ name: body.name }, { $set: {number: body.number} }, { new: true } )
        .then(updatedPerson => {
          console.log(updatedPerson)
        })
        .catch(error => next(error))
    }
  })
  .catch(error => next(error))
})

// PUT REQUESTS
app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body
  
  const person = {
    name: name,
    number: number,
  }

  Person.findByIdAndUpdate(
    request.params.id, 
    person, 
    {new: true, runValidators: true, context: 'query'}
  )
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))

})

// DELETE requests
app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

// this has to be the last loaded middleware.
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT)
console.log(`Server running on port: ${PORT}`)