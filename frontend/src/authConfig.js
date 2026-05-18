export const msalConfig = {
  auth: {
    clientId: "5abb436e-08e0-4bba-8546-67b6b747694d",
    authority: "https://login.microsoftonline.com/87c94cab-ce30-429a-bb0f-898337f6ec50",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};