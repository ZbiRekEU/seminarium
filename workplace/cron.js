var cron = require('node-cron');
var db = require('./database')

class cronShedule{
    // codziennie o godzinie 8:00 planowany termin dostawy zostanie ustawiony na 'Odrzucono' jeśli nikt go nie potwierdził ani nie odrzucił
    async autoRejectDeliveryDateStatus(){
        cron.schedule('0 8 * * *', async() => {
            await db.autoRejectDeliveryDate()
            .then(results=>{
                console.log("Automatyczna zmiana statusu terminu dostawy: ", results);
            })
            .catch(error =>{
                console.log("Błąd podczas automatycznej zmiany statusu terminu dostawy (CRON): ", error);
            })
        },{
            scheduled: true,
            timezone: "Europe/Warsaw"
        });
    }

}

module.exports = new cronShedule()