import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";


const data_api = createApi({
    reducerPath: 'data',
    baseQuery: fetchBaseQuery({ baseUrl: 'data/' }),
    endpoints: (builder) => ({
        fetch_media: builder.query({
            query: squuid => `media/${squuid}`,
        }),
    }),
});

export { data_api };

export const { fetch_media } = data_api;
window.data_api = data_api;

