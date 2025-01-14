# cottonwood-chargers

Utilizing the Blink network api from their maps web app, this will surface the Cottonwood Corporate business park charging stations.

There are 2 endpoints that this app utilizes.

https://apigw.blinknetwork.com/v3/locations/map/{{location-id}}

https://apigw.blinknetwork.com/v3/locations/{{location-id}}



### Map Endpoint

The map endpoint includes the station address, location name. This app is just using this to pull back the full location name

<details>
<summary>Map endpoint sample</summary>

```
{
    "locationId": "12345678-abc1-abc1-abc1-1234567890ab",
    "locationName": "Location Name",
    "address": {
        "addressLine1": "Address line 1",
        "addressLine2": "",
        "city": "City",
        "state": "State",
        "country": "United States",
        "countryCode": "US",
        "postalCode": "99999",
        "currencySymbol": "$",
        "timeZone": "America/Denver"
    },
    "level2PortCount": 10,
    "dcfcPortCount": null,
    "locationSchedule": {
        "locationId": null,
        "timeZone": "America/Denver",
        "locationScheduleInfoDTO": [
            {
                "weekDay": "MONDAY",
                "startTime": "00:00",
                "endTime": "23:59",
                "isOpen": true,
                "isOpenNow": null
            }
        ]
    }
}
```
</details>


### Locations Endpoint
The locations endpoint includes the list of stations at each location. It also provides summary information like total slots and available slots.

The chargers array includes each charger at the location, and it's current status. This web app will display the ID and current status, along with the max power reported by the api.

The unrestricted api does not show the current speed of charge. That data will show in your authenticated mobile app, but seemingly only on chargers that you are actively charging on.


<details>
<summary>Endpoint Sample</summary>

```
[
    {
        "level": "LEVEL_2",
        "totalChargingSlots": 10,
        "availableChargingSlots": 5,
        "imageUrl": null,
        "favourite": null,
        "latidude": null,
        "longitude": null,
        "chargingRate": "",
        "isFlexiblePricingPlan": true,
        "isWaitListEnabled": false,
        "locationId": null,
        "chargers": [
            {
                "level": "Level 2",
                "portName": "PORT-1",
                "serialNumber": "SERIAL123NUM",
                "chargerName": null,
                "speedOfCharge": null,
                "status": "AVAILABLE",
                "portId": "a1bc2de3-4567-8f90-1234-123456789101",
                "chargingRate": "",
                "connectorType": "J1772",
                "maxPower": 6240.0,
                "maxVoltage": 208.0,
                "maxCurrent": 30.0,
                "isRestricted": false,
                "source": "SEMA",
                "operatorDetails": null
            }
        ]
    }
]

```

</details>