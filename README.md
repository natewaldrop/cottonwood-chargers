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


## Blink to Charghub migration

In late 2025 Blink modified their public map to only show charger locations, and not port status. The APIs were still there, but severely deprecated and throttled.

Most of the chargers are visible on the chargehub.com public web for now, and it looks like there is a clean-ish api that we can pull availability data for the chargers from those endpoints.

The 4 Blink stations and their ports are captured as 3 different stations in chargehub


| Station_ID | Station Name | URL | Plugs Array | 
| ----- | ----- | ----- | ----- | 
| 61497 | Extra Space Corporate Office | https://chargehub.azure-api.net/chapi/prod/stations/details?station_id=61497&language=en | |
| 61498 | CW Corp 2825 | https://chargehub.azure-api.net/chapi/prod/stations/details?station_id=61498&language=en |  | 
| 135096 | AXA Equitable | https://chargehub.azure-api.net/chapi/prod/stations/details?station_id=135096&language=en | | 


## Charging Stations Map (Blink Network)

![Charging Stations](Charging%20Stations.png)

| Location | Charger | Station ID | Port ID | Chargehub Id | portId | netPortId |
|----------|---------|------------|---------|--------------|--------|-----------|
| 2755     |       1 |  BAE703006 |       1 | 61497        | 1135047 | 43b43116-b914-443e-b9b6-123cc01ee985 |
| 2755     |       2 |  BAE703006 |       2 | 61497        | 1135048 | 765482af-42ea-4e72-aa90-8a857409ef83 |
| 2755     |       3 |  BAE708333 |       1 | dropped      |        |           |
| 2755     |       4 |  BAE708333 |       2 | dropped      |        |           |
| 2755     |       5 |  BAE603494 |         | 61497        | 1135052 | d9ac0aa1-4972-3e61-1307-300000157891 |
| 2755     |       6 |  BAE060589 |         | 61497        | 1135051       |  d9ac0aa1-4972-3e61-1307-300000259821         |
| 2755     |       7 |  BAE603487 |         | 61497        | 1135049 | d9ac0aa1-4972-3e61-1307-300000157671 |
| 2755     |       8 |  BAE603486 |         | 61497        | 1135050 | d9ac0aa1-4972-3e61-1307-300000157691 |
| 2795     |       1 |  BAE906366 |         | 61497        | 1096293 | d9ac0aa1-4972-3e61-1307-300000059621 |
| 2795     |       2 |  BAE906367 |         | 61497        | 1096294 | d9ac0aa1-4972-3e61-1307-300000059631 |
| 2795     |       3 |  BAE603489 |         | 61497        | 1097665 | d9ac0aa1-4972-3e61-1307-300000157701 |
| 2795     |       4 |  BAE603488 |         | 61497        | 1097669 | d9ac0aa1-4972-3e61-1307-300000157711 |
| 2795     |       5 |  BAE705580 |       1 | dropped      |        |           |
| 2795     |       6 |  BAE705580 |       2 | dropped      |        |           |
| 2795     |       7 |  BAE707704 |       1 | dropped      |        |           |
| 2795     |       8 |  BAE707704 |       2 | dropped      |        |           |
| 2795     |       9 |  BAE708330 |       1 | dropped      |        |           |
| 2795     |      10 |  BAE708330 |       2 | dropped      |        |           |
| 2795     |      11 |  BAE708335 |       1 | 61497        | 820666  | 5f49ffde-71f6-4d32-a10d-45c5c4dc43c6 |
| 2795     |      12 |  BAE708335 |       2 | 61497        | 820665  | 54fcdb22-d840-4137-a40b-fcf7f8a92e16 |
| 2825     |       1 |  BAE603491 |         | 61498        | 878489  | d9ac0aa1-4972-3e61-1307-300000157751 |
| 2825     |       2 |  BAE603490 |         | 61498        | 878488  | d9ac0aa1-4972-3e61-1307-300000157721 |
| 2825     |       3 |  BAE906365 |         | 61498        | 236969  | d9ac0aa1-4972-3e61-1307-300000059611 |
| 2825     |       4 |  BAE906364 |         | 61498        | 236968  | d9ac0aa1-4972-3e61-1307-300000059601 |
| 2855     |       1 |  BAE603492 |         | 135096       | 1119886 | d9ac0aa1-4972-3e61-1307-300000157761 |
| 2855     |       2 |  BAE603496 |         | 135096       | 1119887 | d9ac0aa1-4972-3e61-1307-300000157771 |
| 2855     |       3 |  BAE603493 |         | 135096       | 1097667 | d9ac0aa1-4972-3e61-1307-300000157741 |
| 2855     |       4 |  BAE603485 |         | 135096       | 1097666 | d9ac0aa1-4972-3e61-1307-300000157661 |
| 2855     |       5 |  BAE705939 |       1 | dropped      |        |           |
| 2855     |       6 |  BAE705939 |       2 | dropped      |        |           |
| 2855     |       7 |  BAE705940 |       1 | 135096       | 939847  | a1ecdaaa-05ee-4691-900e-7bee50719788 |
| 2855     |       8 |  BAE705940 |       2 | 135096       | 939846  | 11074b45-4535-4db1-b7b1-fef4062e72d3 |

