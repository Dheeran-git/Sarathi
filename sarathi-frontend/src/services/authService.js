import {
    CognitoIdentityProviderClient,
    SignUpCommand,
    InitiateAuthCommand,
    ConfirmSignUpCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
    ResendConfirmationCodeCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const region = import.meta.env.VITE_AWS_REGION || "us-east-1";
const citizenClientId = import.meta.env.VITE_CITIZEN_CLIENT_ID || import.meta.env.VITE_CLIENT_ID;
const panchayatClientId = import.meta.env.VITE_PANCHAYAT_CLIENT_ID;

const citizenClient = new CognitoIdentityProviderClient({ region });
const panchayatClient = new CognitoIdentityProviderClient({ region });

export const authService = {
    // ── Citizen ──────────────────────────────────────────────────────────────
    citizenSignUp: async (email, password) => {
        return citizenClient.send(new SignUpCommand({
            ClientId: citizenClientId,
            Username: email,
            Password: password,
            UserAttributes: [{ Name: "email", Value: email }],
        }));
    },

    citizenConfirmSignUp: async (email, code) => {
        return citizenClient.send(new ConfirmSignUpCommand({
            ClientId: citizenClientId,
            Username: email,
            ConfirmationCode: code,
        }));
    },

    citizenSignIn: async (email, password) => {
        const response = await citizenClient.send(new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: citizenClientId,
            AuthParameters: { USERNAME: email, PASSWORD: password },
        }));
        if (response.AuthenticationResult) {
            localStorage.setItem("accessToken", response.AuthenticationResult.AccessToken);
            localStorage.setItem("idToken", response.AuthenticationResult.IdToken);
            if (response.AuthenticationResult.RefreshToken) {
                localStorage.setItem("refreshToken", response.AuthenticationResult.RefreshToken);
            }
            localStorage.setItem("userType", "citizen");
        }
        return response;
    },

    // ── Citizen password reset + resend ──────────────────────────────────────
    forgotPassword: async (email) => {
        return citizenClient.send(new ForgotPasswordCommand({
            ClientId: citizenClientId,
            Username: email,
        }));
    },

    confirmForgotPassword: async (email, code, newPassword) => {
        return citizenClient.send(new ConfirmForgotPasswordCommand({
            ClientId: citizenClientId,
            Username: email,
            ConfirmationCode: code,
            Password: newPassword,
        }));
    },

    resendConfirmationCode: async (email) => {
        return citizenClient.send(new ResendConfirmationCodeCommand({
            ClientId: citizenClientId,
            Username: email,
        }));
    },

    // ── Panchayat ─────────────────────────────────────────────────────────────
    panchayatSignUp: async (email, password) => {
        return panchayatClient.send(new SignUpCommand({
            ClientId: panchayatClientId,
            Username: email,
            Password: password,
            UserAttributes: [{ Name: "email", Value: email }],
        }));
    },

    panchayatConfirmSignUp: async (email, code) => {
        return panchayatClient.send(new ConfirmSignUpCommand({
            ClientId: panchayatClientId,
            Username: email,
            ConfirmationCode: code,
        }));
    },

    panchayatSignIn: async (email, password) => {
        const response = await panchayatClient.send(new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: panchayatClientId,
            AuthParameters: { USERNAME: email, PASSWORD: password },
        }));
        if (response.ChallengeName) {
            const err = new Error(
                response.ChallengeName === 'NEW_PASSWORD_REQUIRED'
                    ? 'A password reset is required. Please use "Forgot Password?"'
                    : `Authentication challenge required: ${response.ChallengeName}. Please contact support.`
            );
            err.name = response.ChallengeName;
            throw err;
        }
        if (response.AuthenticationResult) {
            localStorage.setItem("panchayatAccessToken", response.AuthenticationResult.AccessToken);
            localStorage.setItem("panchayatIdToken", response.AuthenticationResult.IdToken);
            if (response.AuthenticationResult.RefreshToken) {
                localStorage.setItem("panchayatRefreshToken", response.AuthenticationResult.RefreshToken);
            }
            localStorage.setItem("userType", "panchayat");
        } else {
            throw new Error('Login failed: no authentication tokens received. Please try again.');
        }
        return response;
    },

    // ── Panchayat password reset + resend ─────────────────────────────────────
    panchayatForgotPassword: async (email) => {
        return panchayatClient.send(new ForgotPasswordCommand({
            ClientId: panchayatClientId,
            Username: email,
        }));
    },

    panchayatConfirmForgotPassword: async (email, code, newPassword) => {
        return panchayatClient.send(new ConfirmForgotPasswordCommand({
            ClientId: panchayatClientId,
            Username: email,
            ConfirmationCode: code,
            Password: newPassword,
        }));
    },

    panchayatResendConfirmationCode: async (email) => {
        return panchayatClient.send(new ResendConfirmationCodeCommand({
            ClientId: panchayatClientId,
            Username: email,
        }));
    },

    // ── Shared ────────────────────────────────────────────────────────────────
    signOut: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("idToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("panchayatAccessToken");
        localStorage.removeItem("panchayatIdToken");
        localStorage.removeItem("panchayatRefreshToken");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userType");
    },

    getToken: () => localStorage.getItem("accessToken"),
    getPanchayatToken: () => localStorage.getItem("panchayatAccessToken"),

    // Legacy aliases (kept so old code still compiles)
    signUp: async (email, password) => authService.citizenSignUp(email, password),
    confirmSignUp: async (email, code) => authService.citizenConfirmSignUp(email, code),
    signIn: async (email, password) => authService.citizenSignIn(email, password),
};
