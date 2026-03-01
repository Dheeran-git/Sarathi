import { CognitoIdentityProviderClient, SignUpCommand, InitiateAuthCommand, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const region = import.meta.env.VITE_AWS_REGION || "ap-south-1";
const clientId = import.meta.env.VITE_CLIENT_ID || "mock-client-id";

const client = new CognitoIdentityProviderClient({ region });

export const authService = {
    signUp: async (email, password) => {
        const command = new SignUpCommand({
            ClientId: clientId,
            Username: email,
            Password: password,
            UserAttributes: [{ Name: "email", Value: email }],
        });
        return client.send(command);
    },

    confirmSignUp: async (email, code) => {
        const command = new ConfirmSignUpCommand({
            ClientId: clientId,
            Username: email,
            ConfirmationCode: code,
        });
        return client.send(command);
    },

    signIn: async (email, password) => {
        const command = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: clientId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
            },
        });

        const response = await client.send(command);

        if (response.AuthenticationResult) {
            localStorage.setItem("accessToken", response.AuthenticationResult.AccessToken);
            localStorage.setItem("idToken", response.AuthenticationResult.IdToken);
            if (response.AuthenticationResult.RefreshToken) {
                localStorage.setItem("refreshToken", response.AuthenticationResult.RefreshToken);
            }
        }
        return response;
    },

    signOut: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("idToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userEmail");
    },

    getToken: () => {
        return localStorage.getItem("accessToken");
    }
};
