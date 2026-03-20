    import { Resource } from "sst";

    export const handler = async (event: any) => {
        try {
            console.log("Request to Bucket:", Resource.SpotifyMedia.name);

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Ready to upload to Spotify Media!",
                    bucket: Resource.SpotifyMedia.name,
                }),
            };
        } catch (error) {
            return { statusCode: 500, body: "Server Error" };
        }
    };