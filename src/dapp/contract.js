import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.initialize(callback);
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    registerAirline(airline, name, callback) {
        let self = this;
        let payload = {
            airline: airline,
            name: name
        }

        self.flightSuretyApp.methods
            .registerAirline(payload.airline, payload.name)
            .send({ from: self.airlines[0], gas: 5000000}, (error, result) => {
                callback(error, result);
            });
    }

    fundAirline(airline, callback) {
        let self = this;

        self.flightSuretyApp.methods
            .fundAirline()
            .send({ from: airline, gas: 5000000, value: this.web3.utils.toWei('10', 'ether')}, (error, result) => {
                callback(error, result);
            });
    }

    registerFlight(airline, flight, origin, departure, destination, arrival, callback) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flight,
            origin: origin,
            departure: (new Date(departure).getTime()/1000),
            destination: destination,
            arrival: (new Date(arrival).getTime()/1000)
        }

        self.flightSuretyApp.methods
            .registerFlight(payload.flight, payload.origin, payload.departure, payload.destination, payload.arrival)
            .send({ from: payload.airline, gas: 5000000}, (error, result) => {
                callback(error, result);
            });
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 

        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }
}