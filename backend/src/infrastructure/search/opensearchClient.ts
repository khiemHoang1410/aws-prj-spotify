import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

let _client: Client | null = null;
let _clientEndpoint: string | null = null;

export function getOpenSearchClient(): Client {
    // Đọc trong function — không phải top-level — để Lambda runtime đã inject env vars
    const endpoint = process.env.OPENSEARCH_ENDPOINT || "";
    if (!endpoint) {
        throw new Error("OPENSEARCH_ENDPOINT env var is not set");
    }

    // Reset singleton nếu endpoint thay đổi
    if (_client && _clientEndpoint === endpoint) return _client;

    _clientEndpoint = endpoint;
    _client = new Client({
        ...AwsSigv4Signer({
            region: process.env.AWS_REGION || "ap-southeast-1",
            service: "es",
            getCredentials: defaultProvider(),
        }),
        node: endpoint,
    });

    return _client;
}

export const INDICES = {
    SONGS:   "songs",
    ARTISTS: "artists",
    ALBUMS:  "albums",
} as const;
