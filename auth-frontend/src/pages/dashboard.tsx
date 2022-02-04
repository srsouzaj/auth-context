import React, { useContext, useEffect } from 'react';
import { Can } from '../Components/Can';
import { AuthContext, signOut } from '../contexts/AuthContext';
import { useCan } from '../hooks/useCan';
import { setupAPIClient } from '../services/api';
import { api } from "../services/apiClient";
import withSSRAuth from '../utils/withSSRAuth';

export default function Dashboard() {

    const { user, signOut, isAuthenticated } = useContext(AuthContext)

    const userCanSeeMetrics = useCan({
        roles: ['administrator', 'editor']
    });


    useEffect(() => {
        api.get('/me').then(response => console.log(response))
            .catch(err => console.log(err));
    }, [])
    return (
        <>
            <h1>Hello World: {user?.email}</h1>
            <button onClick={signOut}>SignOut</button>

            <Can permissions={['metrics.list']}>
                <div>Métrica</div>
            </Can>
        </>
    )
};


export const getServerSideProps = withSSRAuth(async (ctx) => {

    const apiClient = setupAPIClient(ctx)
    const response = await apiClient.get('/me')

    console.log(response.data)

    return {
        props: {}
    }
})
