import { React, useEffect, useState } from "react";
import { Grid, Paper, Typography, useTheme } from "@mui/material";
import { host } from "../../App";
import { set } from "date-fns";

const Energy = ({room_id, callbackSetSignIn, time_delay, backend_host}) =>{
    const url = `http://${backend_host}/api/energydata/realtime/monitor?room_id=${room_id}`;
    const [isLoading, setIsLoading] = useState(true);
    const [energyData, setEnergyData] = useState(null);
    const [timeRequestAPI, setTimeRequestAPI] = useState(0);

    const define_energy_data = {
        'node_id': {'name': 'null', 'unit': null},
        'voltage': {'name': 'Voltage', 'unit': 'V'},
        'current': {'name': 'current', 'unit': 'A'},
        'active_power': {'name': 'Active Power', 'unit': 'kW'},
        'power_factor': {'name': 'Power factor', 'unit': null},
        'frequency': {'name': 'Frequency', 'unit': 'Hz'},
        'active_energy': {'name': 'Active energy', 'unit': 'kWh'},
        'time': {'name': null, 'unit': null},
    }
    const energy_data_property_array = Object.keys(define_energy_data);

    const get_energy_data = async (url, access_token) => 
    {
        const headers = 
        {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
        }
        const option_fetch = 
        {
            "method": "GET",
            "headers": headers,
            "body": null,
        }

        const requestAgain = false;
        const response = await fetch(url, option_fetch);
        const data = await response.json(); // data la cai j?
        if (data) {
            let newEnergyData = {
                'voltage': null,
                'current': null,
                'active_power': null,
                'power_factor': null,
                'frequency': null,
                'active_energy': null,
                'time': null
            }
            energy_data_property_array.forEach((each_key, index) => {
                let fetch_data = data[index];
                // if data is invaild, send get data API request again
                switch (index) {
                    case 0: return; // skip node id
                    case 1: 
                        if (fetch_data > 240 || fetch_data < 200) {
                            fetch_data = 'NULL';
                            requestAgain = true;
                        }
                        break;
                    case 2:
                    case 3:
                    case 6:
                        if (fetch_data < 0) {
                            fetch_data = 'NULL';
                            requestAgain = true;
                        }
                        break;
                    case 4:
                        if (fetch_data < 0 || fetch_data > 1) {
                            fetch_data = 'NULL';
                            requestAgain = true;
                        }
                        break;
                    case 5:
                        if (fetch_data < 0 || fetch_data > 100) {
                            fetch_data = 'NULL';
                            requestAgain = true;
                        }
                    case 7:
                        if (fetch_data < 0) {
                            fetch_data = 'NULL';
                            requestAgain = true;
                        }
                        else fetch_data = parseInt(fetch_data);
                        break;
                }
                newEnergyData[each_key] = fetch_data;
                if (requestAgain && timeRequestAPI < 5) {
                    setTimeRequestAPI(timeRequestAPI+1);
                    return;
                }
            })
            setIsLoading(false);
            if (!requestAgain) {
                setEnergyData(newEnergyData);
                return true; // successful, no problem with data
            }
        }
        else {
            console.log("Some error happened, try to reload page!");
        }
        return false; // failed, data is invalid or cant get data
    }

    const verify_and_get_data = async (fetch_data_function, callbackSetSignIn, backend_host) => 
    {
        const token = {access_token: null, refresh_token: null}
        // const backend_host = host;
        if(localStorage.getItem("access") !== null && localStorage.getItem("refresh") !== null)
        {
            token.access_token = localStorage.getItem("access"); 
            token.refresh_token = localStorage.getItem("refresh");
        }
        else
        {
            throw new Error("There is no access token and refresh token ....");
        }

        const verifyAccessToken  = async () =>
        {
            //call the API to verify access-token
            const verify_access_token_API_endpoint = `http://${backend_host}/api/token/verify`
            const verify_access_token_API_data = 
            {
                "token": token.access_token,
            }
            const verify_access_token_API_option = 
            {
                "method": "POST",
                "headers": 
                {
                    "Content-Type": "application/json",
                },
                "body": JSON.stringify(verify_access_token_API_data),

            }
            const verify_access_token_API_response = await fetch(verify_access_token_API_endpoint, 
                                                                verify_access_token_API_option,);
            if(verify_access_token_API_response.status !== 200)
            {
                return false;
            }
            return true;
        }

        /*
        *brief: this function is to verify the refresh-token and refresh the access-token if the refresh-token is still valid
        */
        const verifyRefreshToken  = async () =>
        {
            //call the API to verify access-token
            const verify_refresh_token_API_endpoint = `http://${backend_host}/api/token/refresh`
            const verify_refresh_token_API_data = 
            {
                "refresh": token.refresh_token,
            }
            const verify_refresh_token_API_option = 
            {
                "method": "POST",
                "headers": 
                {
                    "Content-Type": "application/json",
                },
                "body": JSON.stringify(verify_refresh_token_API_data),

            }
            const verify_refresh_token_API_response = await fetch(verify_refresh_token_API_endpoint, 
                                                                    verify_refresh_token_API_option,);
            const verify_refresh_token_API_response_data = await verify_refresh_token_API_response.json();
            if(verify_refresh_token_API_response.status !== 200)
            {
                return false;
            }
            else if(verify_refresh_token_API_response.status === 200 &&  verify_refresh_token_API_response_data.hasOwnProperty("access"))
            {
                localStorage.setItem("access", verify_refresh_token_API_response_data["access"]);
                localStorage.setItem("refresh", verify_refresh_token_API_response_data["refresh"]);
                return true
            }
            else
            {
                throw new Error("Can not get new access token ....");
            }
        }

        const verifyAccessToken_response = await verifyAccessToken();

        let get_data_successful = false; // 1 is successful, 0 is failed
        if(verifyAccessToken_response === true)
        {
            // get data maximum 5 times
            do {
                get_data_successful = await fetch_data_function(url, token["access_token"])
            } while ((timeRequestAPI < 5) && (get_data_successful))
            setTimeRequestAPI(0);
        }
        else
        {
            let verifyRefreshToken_response = null;
            try
            {
                verifyRefreshToken_response = await verifyRefreshToken();
            }
            catch(err)
            {
                alert(err);
            }
            if(verifyRefreshToken_response === true)
            {
                do {
                    get_data_successful = await fetch_data_function(url, token["access_token"])
                } while ((timeRequestAPI < 5) && (get_data_successful))
                if (timeRequestAPI == 5) console.log('DATA IS INVALID')
                setTimeRequestAPI(0);
            }
            else
            {
                callbackSetSignIn(false);
            }
        }
    }

    useEffect(() => {
        if(time_delay !== 0)
        {
            if(infoData === null)            //!< this is for the total component always render the first time and then the next time will be setTimeOut
            {
                verify_and_get_data(get_energy_data, callbackSetSignIn, backend_host, url); 
            }
            else
            {
                const timer = setTimeout(()=>{
                        verify_and_get_data(get_energy_data, callbackSetSignIn, backend_host, url); 
                    }, time_delay);
                return () => clearTimeout(timer);
            }
        }
        else
        {
            verify_and_get_data(get_energy_data, callbackSetSignIn, backend_host, url); 
        }
    },[energyData])

    return (
        <>
        {
            isLoading ? <h1>Loading...</h1> :
            <Grid container textAlign='center' justifyContent='center'>
                <Grid item xs={12} sm={12} md={12} textAlign="center" >
                    <Typography fontWeight="bold" fontSize='21px'>
                        Energy Data
                    </Typography>
                </Grid>
                <Grid item container spacing={1} px='10px' marginY={0.5} justifyContent='center'>
                    {energy_data_property_array.map((value, index) => {
                        <Grid item xs={4}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Paper style={{ flex: 1, backgroundColor: 'white', padding: '10px' }}>
                                <Grid container display="flex" flexDirection="column" justifyItems='center' textAlign='center'>
                                    <Grid container item justifyContent='center' alignContent='center'>
                                        <Typography variant='h4'>{define_energy_data[value]['name']}</Typography>
                                    </Grid>
                                    <Grid item>
                                        <Typography variant='h5'>
                                            {((temp) => {
                                                if (energyData[value] == 'NULL' || index == 4) temp = energyData[value];
                                                else temp = `${energyData[value]} ${define_energy_data[value]['unit']}`
                                                return temp;
                                            })()}
                                            </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                            </div>
                        </Grid>
                    })}
                </Grid>
                <Grid xs={12} textAlign='center' spacing={1} marginY={1}>
                    <Typography textAlign='center' variant='h5'>updated on {
                                            (()=>{
                                                const new_time = energyData["time"] - 7*60*60;
                                                const utcDate = new Date(new_time * 1000); // Convert seconds to milliseconds
                                                const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'};
                                                const formattedDateTime = utcDate.toLocaleDateString('en-US', options);

                                                return formattedDateTime;
                                            })()   //run this function
                                        }
                    </Typography>
                </Grid>
            </Grid>
        }
        </>
    );
}

export default Energy;