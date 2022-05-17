const express = require('express')
const app = express()
require("dotenv").config();
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

// Middle wear
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.robdy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('doctors-portal').collection('services')
        const bookingCollection = client.db('doctors-portal').collection('bookings')

        // Get all services data
        app.get('/service', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray()
            res.send(services)
        })

        // get available services
        app.get('/available', async (req, res) => {
            const date = req.query.date
            const services = await serviceCollection.find().toArray();
            const query = { date: date }
            const bookings = await bookingCollection.find(query).toArray()
            services.forEach(service => {
                const serviceBookings = bookings.filter(b => b.treatment === service.name)
                const booked = serviceBookings.map(s => s.slot)
                const available = service.slots.filter(slot => !booked.includes(slot))
                service.slots = available
            })
            res.send(services);
        })
        // get my booking data
        app.get('/booking', async (req, res) => {
            const patientEmail = req.query.patientEmail;
            const query = { patientEmail: patientEmail }
            const bookings = await bookingCollection.find(query).toArray()
            res.send(bookings)
        })

        
        // post booking data
        app.post('/booking', async (req, res) => {
            const booking = req.body
            // console.log(booking);
            const query = { treatment: booking.treatment, date: booking.date, patientEmail: booking.patientEmail }
            console.log(query);
            const exist = await bookingCollection.findOne(query);
            console.log(exist);
            if (exist) {
                return res.send({ success: false, booking: exist })
            }
            const result = bookingCollection.insertOne(booking)
            res.send({ success: true, result })
        })

    }
    finally {
        //await client.close
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})