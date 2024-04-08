import { React, useEffect, useState } from "react";
import { Grid, Paper, Tooltip, Typography, useTheme } from "@mui/material";
import { host } from "../../App";
import ThermostatIcon from '@mui/icons-material/Thermostat';
import Co2Icon from '@mui/icons-material/Co2';
import InvertColorsIcon from '@mui/icons-material/InvertColors';
import FilterDramaIcon from '@mui/icons-material/FilterDrama';
import LightModeIcon from '@mui/icons-material/LightMode';
import BoyIcon from '@mui/icons-material/Boy';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import LensBlurIcon from '@mui/icons-material/LensBlur';
import { dateCalendarClasses } from "@mui/x-date-pickers";


export default function AqiRef({callbackSetSignIn, time_delay})
{
    const url = `http://${host}/api/aqi_ref`;

    const [isLoading, setIsLoading] = useState(true);

    const [data, setData] = useState(null);

    const rating_index = {
        1 : {"level": "Good" , "colour": "green"},
        2 : {"level": "Moderate", "colour": "yellow"},
        3 : {"level": "Unhealthy for Sensitive Groups", "colour": "orange"},
        4 : {"level": "Unhealthy", "colour": "red"},
        5 : {"level": "Very Unhealthy", "colour": "purple"},
        6 : {"level": "Hazardous", "colour": "maroon"},
    };
    
    const rating_array = [
        {"key": 1 , "min": 0, "max": 50},
        {"key": 2 ,"min": 51, "max": 100},
        {"key": 3, "min": 101, "max": 150},
        {"key": 4, "min": 151, "max": 200},
        {"key": 5, "min": 201, "max": 300},
        {"key": 6, "min": 301, "max": 500},
    ];
    


    const fetch_data_function = async (api, access_token) =>
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
        const response = await fetch(api, option_fetch);
        if(response.status == 200)
        {
            const data = await response.json();
            const new_data = data["Response"]  
            let index = 0;
            for(let i=0; i<rating_array.length; ++i)
            {
                if(rating_array[i]["min"] <= new_data["aqi"] && new_data["aqi"] <= rating_array[i]["max"])
                {
                    index = rating_array[i]["key"];
                    break;
                }
            }
            if(rating_index.hasOwnProperty(index))
            {
                new_data["rating"] = 
                {
                    "color": rating_index[index]["colour"],
                    "rate": rating_index[index]["level"],
                }
            }
            else
            {
                new_data["rating"] = 
                {
                    "color": "white",
                    "rate": "No data",
                }
            }
            setData(new_data);
        }
        else
        {
            let new_data;
            new_data["rating"] = 
                {
                    "color": "white",
                    "rate": "No data",
                }
            setData(new_data);
        }
        setIsLoading(false);
    }

    const verify_and_get_data = async (fetch_data_function, callbackSetSignIn, backend_host, url) => 
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

        const  verifyAccessToken_response = await verifyAccessToken();

        if(verifyAccessToken_response === true)
        {
            // const response = await fetch(url)
            // const data = await response.json()
            fetch_data_function(url, token["access_token"])
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
                fetch_data_function(url, token["access_token"]);
            }
            else
            {
                callbackSetSignIn(false);
            }
        }

    }

    useEffect(()=>{
            if(data === null)            //!< this is for the total component always render the first time and then the next time will be setTimeOut
            {
                verify_and_get_data(fetch_data_function, callbackSetSignIn, host, url); 
            }
            else
            {
                const timer = setTimeout(()=>{
                        verify_and_get_data(fetch_data_function, callbackSetSignIn, host, url); 
                    }, time_delay);
                return () => clearTimeout(timer);
            }
    },[data])


    return(
        <>
            {
                isLoading ?
                <h1>Loading...</h1>
                :
                <Grid container textAlign='center'>
                <Grid xs={12} sm={12} md={12} textAlign="center" columnSpacing={2}>
                    <Typography variant='h4' fontWeight="bold">
                        Hanoi AQI: Hanoi Real-time Air Quality Index (AQI)
                    </Typography>
                </Grid>
                <Grid container spacing={1} margin={1}>
                    <Grid item xs={6}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Paper style={{ flex: 1, backgroundColor: 'white', padding: '10px' }}>
                            <Grid container display="flex" flexDirection="column" justifyItems='center' textAlign='center'>
                                <Grid container item justifyContent='center' alignContent='center'>
                                    <Tooltip style={{
                                        fontSize: '20px'   
                                    }}
                                        title={`PM2.5: ${data["pm25"]}\nPM10: ${data["pm10"]}\nO3: ${data["o3"]}\nNO2: ${data["no2"]}\nSO2: ${data["so2"]}\nCO: ${data["co"]}\n`}>
                                    <div style={{
                                        width: '100px', // Adjust as needed
                                        height: '100px', // Adjust as needed
                                        border: '10px solid', // Border makes the circle hollow
                                        borderColor: 'darkgreen',
                                        borderRadius: '50%', // Makes the div a circle
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        position: 'relative',
                                    }}>
                                        <span style={{
                                            position: 'relative',
                                            color: 'black',
                                        }}>
                                            AQI
                                        </span>
                                    </div>
                                    </Tooltip>
                                </Grid>
                                <Grid item>
                                    <Typography variant='h5'>Good air</Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                        </div>
                    </Grid>
                    <Grid item xs={6}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Paper style={{ flex: 1, backgroundColor: 'white', padding: '10px' }}>
                            <Grid container display="flex" flexDirection="column" alignContent='center' alignItems='center' textAlign='center'>
                                <Grid item>
                                    <ThermostatIcon style={{fontSize: '4.6rem'}}/>
                                </Grid>
                                <Grid item>
                                    <Typography textAlign='center' variant='h5'>Temperature</Typography>
                                    <Typography textAlign='center' variant='h5'>{data["t"]}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                        </div>
                    </Grid>
                    <Grid item xs={4}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Paper style={{ flex: 1, backgroundColor: 'white', padding: '10px' }}>
                            <Grid container display="flex" flexDirection="column" alignContent='center' textAlign='center'>
                                <Grid item>
                                    <Co2Icon style={{fontSize: '3rem'}}/>
                                </Grid>
                                <Grid item>
                                    <Typography textAlign='center' variant='h5'>CO2</Typography>
                                    <Typography textAlign='center' variant='h5'>{data["p"]}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                        </div>
                    </Grid>
                    <Grid item xs={4}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Paper style={{ flex: 1, backgroundColor: 'white', padding: '10px' }}>
                            <Grid container display="flex" flexDirection="column" alignContent='center' textAlign='center'>
                                <Grid item>
                                    <InvertColorsIcon style={{fontSize: '3rem'}}/>
                                </Grid>
                                <Grid item>
                                    <Typography textAlign='center' variant='h5'>Humidity</Typography>
                                    <Typography textAlign='center' variant='h5'>{data["h"]}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                        </div>
                    </Grid>
                    <Grid item xs={4}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Paper style={{ flex: 1, backgroundColor: 'white', padding: '10px' }}>
                            <Grid container display="flex" flexDirection="column" alignContent='center' textAlign='center'>
                                <Grid item>
                                    <FilterDramaIcon style={{fontSize: '3rem'}}/>
                                </Grid>
                                <Grid item>
                                    <Typography textAlign='center' variant='h5'>Wind</Typography>
                                    <Typography textAlign='center' variant='h5'>{data["w"]}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                        </div>
                    </Grid>
                </Grid>
                <Grid xs={12} textAlign='center' spacing={1}>
                    <Typography textAlign='center' variant='h5'>updated on {
                                            (()=>{
                                                const new_time = data["time"] - 7*60*60;
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