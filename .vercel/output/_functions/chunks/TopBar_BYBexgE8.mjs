import { jsxDEV, Fragment } from 'react/jsx-dev-runtime';
import { useState, useRef, useEffect, startTransition } from 'react';
import { FiLogOut, FiSave, FiMoon, FiSun } from 'react-icons/fi';
import { b as store, l as login, t as toggleTheme, c as logout } from './utils_BdwD7BdC.mjs';

function createClient(config) {
  if (!config) {
    throw new Error("Authentik client configuration is required");
  }
  const {
    clientId,
    clientSecret,
    redirectUri,
    scopes,
    baseUrl,
    storageKey
  } = config;
  if (!baseUrl) {
    throw new Error("Authentik base URL is required");
  }
  if (!clientSecret) {
    throw new Error("Client secret is required for this Authentik application");
  }
  const login = async (originalUrl) => {
    try {
      const sanitizedBaseUrl = (baseUrl || "").toString().replace(/\/+$/, "");
      if (!sanitizedBaseUrl) {
        throw new Error("Invalid Authentik base URL");
      }
      const currentUrl = originalUrl || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/");
      console.log("DEBUG LOGIN - Storing URL:", {
        originalUrl,
        currentUrl,
        windowLocation: typeof window !== "undefined" ? window.location.href : "No window"
      });
      const authorizationUrl = `${sanitizedBaseUrl}/application/o/authorize/`;
      const url = new URL(authorizationUrl);
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", scopes);
      localStorage.setItem(`${storageKey}redirect_uri`, currentUrl);
      window.location.href = url.toString();
    } catch (error) {
      console.error("Login initialization failed:", error);
      throw error;
    }
  };
  const handleCallback = async (code) => {
    try {
      const sanitizedBaseUrl = (baseUrl || "").toString().replace(/\/+$/, "");
      if (!sanitizedBaseUrl) {
        throw new Error("Invalid Authentik base URL");
      }
      if (!code) {
        throw new Error("Authorization code is required");
      }
      if (!clientId) {
        throw new Error("Client ID is required");
      }
      if (!clientSecret) {
        throw new Error("Client Secret is required");
      }
      if (!redirectUri) {
        throw new Error("Redirect URI is required");
      }
      const tokenUrl = new URL(`${sanitizedBaseUrl}/application/o/token/`);
      console.log("DEBUG TOKEN EXCHANGE CONFIGURATION:", {
        tokenUrl: tokenUrl.toString(),
        clientId,
        redirectUri,
        baseUrl: sanitizedBaseUrl,
        codeLength: code.length,
        clientSecretLength: clientSecret.length
      });
      const tokenParams = new URLSearchParams();
      tokenParams.append("client_id", clientId);
      tokenParams.append("client_secret", clientSecret);
      tokenParams.append("redirect_uri", redirectUri);
      tokenParams.append("grant_type", "authorization_code");
      tokenParams.append("code", code);
      console.log("DEBUG TOKEN EXCHANGE PARAMS:", {
        params: Object.fromEntries(tokenParams.entries())
      });
      let tokenResponse;
      try {
        tokenResponse = await fetch(tokenUrl.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
          },
          body: tokenParams.toString()
        });
      } catch (fetchError) {
        const errorDetails = fetchError instanceof Error ? {
          errorName: fetchError.name,
          errorMessage: fetchError.message,
          errorStack: fetchError.stack
        } : {
          errorName: "Unknown Fetch Error",
          errorMessage: String(fetchError),
          errorStack: null
        };
        console.error("Fetch Error during token exchange:", {
          ...errorDetails,
          tokenUrl: tokenUrl.toString(),
          clientIdUsed: clientId,
          redirectUriUsed: redirectUri
        });
        throw new Error(`Network error during token exchange: ${errorDetails.errorMessage}`);
      }
      const responseHeaders = Object.fromEntries(tokenResponse.headers.entries());
      const responseStatus = {
        ok: tokenResponse.ok,
        status: tokenResponse.status,
        statusText: tokenResponse.statusText
      };
      console.log("Token Exchange Response Details:", {
        ...responseStatus,
        headers: responseHeaders
      });
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token Exchange Error:", {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          errorBody: errorText,
          requestParams: Object.fromEntries(tokenParams)
        });
        throw new Error(`Failed to exchange authorization code. Status: ${tokenResponse.status}, Error: ${errorText}`);
      }
      let tokens;
      try {
        tokens = await tokenResponse.json();
        console.log("Token Response Parsed:", {
          hasAccessToken: !!tokens.access_token,
          hasIdToken: !!tokens.id_token,
          tokenKeys: Object.keys(tokens)
        });
      } catch (parseError) {
        const errorDetails = parseError instanceof Error ? {
          errorName: parseError.name,
          errorMessage: parseError.message,
          errorStack: parseError.stack
        } : {
          errorName: "Unknown Parse Error",
          errorMessage: String(parseError),
          errorStack: null
        };
        console.error("Token Parse Error:", errorDetails);
        throw new Error(`Failed to parse token response: ${errorDetails.errorMessage}`);
      }
      if (!tokens.access_token) {
        throw new Error("No access token received");
      }
      localStorage.setItem(`${storageKey}access_token`, tokens.access_token);
      localStorage.setItem(`${storageKey}id_token`, tokens.id_token || "");
      const userInfoUrl = new URL(`${sanitizedBaseUrl}/application/o/userinfo/`);
      let userInfoResponse;
      try {
        userInfoResponse = await fetch(userInfoUrl.toString(), {
          headers: {
            "Authorization": `Bearer ${tokens.access_token}`
          }
        });
      } catch (fetchError) {
        const errorDetails = fetchError instanceof Error ? {
          errorName: fetchError.name,
          errorMessage: fetchError.message,
          errorStack: fetchError.stack
        } : {
          errorName: "Unknown Fetch Error",
          errorMessage: String(fetchError),
          errorStack: null
        };
        console.error("Fetch User Info Error:", errorDetails);
        throw new Error(`Network error fetching user info: ${errorDetails.errorMessage}`);
      }
      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error("User Info Fetch Error:", {
          status: userInfoResponse.status,
          statusText: userInfoResponse.statusText,
          errorBody: errorText
        });
        throw new Error(`Failed to fetch user info. Status: ${userInfoResponse.status}, Error: ${errorText}`);
      }
      const userInfo = await userInfoResponse.json();
      console.log("User Info Retrieved:", {
        userInfoKeys: Object.keys(userInfo)
      });
      localStorage.setItem(`${storageKey}user_info`, JSON.stringify(userInfo));
      if (typeof window !== "undefined") {
        window.location.href = `${window.location.origin}/Page`;
      }
      return userInfo;
    } catch (error) {
      const errorDetails = error instanceof Error ? {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      } : {
        errorName: "Unknown Error",
        errorMessage: String(error),
        errorStack: null
      };
      console.error("Authentication callback failed:", errorDetails);
      throw error;
    }
  };
  const logout = async () => {
    try {
      const sanitizedBaseUrl = (baseUrl || "").toString().replace(/\/+$/, "");
      if (!sanitizedBaseUrl) {
        throw new Error("Invalid Authentik base URL");
      }
      localStorage.removeItem(`${storageKey}access_token`);
      localStorage.removeItem(`${storageKey}id_token`);
      localStorage.removeItem(`${storageKey}user_info`);
      const logoutUrl = new URL(`${sanitizedBaseUrl}/application/o/end-session/`);
      logoutUrl.searchParams.set("client_id", clientId);
      logoutUrl.searchParams.set("post_logout_redirect_uri", redirectUri);
      window.location.href = logoutUrl.toString();
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };
  const getUserInfo = async () => {
    try {
      const storedUserInfo = localStorage.getItem(`${storageKey}user_info`);
      if (storedUserInfo) {
        try {
          return JSON.parse(storedUserInfo);
        } catch {
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to get user info:", error);
      return null;
    }
  };
  return {
    login,
    handleCallback,
    logout,
    getUserInfo
  };
}

if (typeof window !== "undefined") {
  window.forceSaveReduxState = (immediate = false) => {
    console.log("Force save called from outside TopBar");
    const state = store.getState();
    const event = new CustomEvent("force-save-state", {
      detail: { state, immediate }
    });
    window.dispatchEvent(event);
  };
}
const TopBar = ({ initialTheme: initialPropTheme }) => {
  const [theme, setTheme] = useState(initialPropTheme || "light");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [redirectUri, setRedirectUri] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState({});
  const [lastSavedState, setLastSavedState] = useState("");
  const [isClient, setIsClient] = useState(false);
  const saveTimeoutRef = useRef(null);
  const postStateToBackend = async (state, immediate = false) => {
    if (!isClient) return;
    console.log("postStateToBackend called", { immediate, autoSaveEnabled });
    if (saveTimeoutRef.current !== null) {
      console.log("Clearing previous save timeout");
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (!immediate && autoSaveEnabled) {
      console.log("Setting debounce timeout for save");
      saveTimeoutRef.current = window.setTimeout(() => {
        console.log("Debounce timeout expired, saving state");
        saveState(state, true);
      }, 1e3);
      return;
    }
    if (immediate || !autoSaveEnabled) {
      console.log("Saving immediately without debounce");
      saveState(state, immediate);
    }
  };
  const saveState = async (state, force = false) => {
    try {
      setSaving(true);
      const stateJson = JSON.stringify(state);
      console.log("saveState called", {
        stateJsonLength: stateJson.length,
        lastSavedStateLength: lastSavedState ? lastSavedState.length : 0,
        force
      });
      if (!force && stateJson === lastSavedState) {
        console.log("State unchanged, skipping save");
        setSaving(false);
        return;
      }
      console.log("Saving state to backend...", {
        panelLayout: state.panellayout?.panels ? Object.keys(state.panellayout.panels) : "none",
        themeMode: state.theme?.mode || "unknown",
        todoCount: state.todos?.items?.length || 0
      });
      console.log("Making POST request to /api/store-card");
      const response = await fetch("/api/store-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: stateJson
      });
      if (!response.ok) {
        throw new Error(`Failed to save state: ${response.statusText}`);
      }
      const result = await response.json();
      console.log("State saved successfully:", result);
      setLastSavedState(stateJson);
      setLastSaved(/* @__PURE__ */ new Date());
    } catch (error) {
      console.error("Error saving state:", error);
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    setIsClient(true);
    if (typeof window === "undefined") return;
    const initialState = store.getState();
    setLastSavedState(JSON.stringify(initialState));
    console.log("Initial state set for auto-save comparison");
    const userState = initialState.user;
    console.log("Initial user state from Redux:", userState);
    if (userState && userState.isAuthenticated) {
      startTransition(() => {
        setIsAuthenticated(true);
        setUserProfile({
          email: userState.profile?.email,
          email_verified: userState.profile?.email_verified,
          sub: userState.profile?.sub
        });
      });
    }
    const storeTheme = initialState.theme?.mode || "light";
    startTransition(() => {
      setTheme(storeTheme);
    });
    const unsubscribeTheme = store.subscribe(() => {
      const currentTheme = store.getState().theme?.mode;
      if (currentTheme && currentTheme !== theme) {
        startTransition(() => {
          setTheme(currentTheme);
        });
      }
    });
    const unsubscribeUser = store.subscribe(() => {
      const currentUserState = store.getState().user;
      console.log("User state updated in Redux:", currentUserState);
      if (currentUserState) {
        const shouldBeAuthenticated = !!currentUserState.isAuthenticated;
        if (shouldBeAuthenticated !== isAuthenticated) {
          startTransition(() => {
            setIsAuthenticated(shouldBeAuthenticated);
            if (shouldBeAuthenticated) {
              setUserProfile({
                email: currentUserState.profile?.email,
                email_verified: currentUserState.profile?.email_verified,
                sub: currentUserState.profile?.sub
              });
            } else {
              setUserProfile({});
            }
          });
        }
      }
    });
    const handleForceSave = (event) => {
      console.log("Force save event received", event.detail);
      const { state, immediate } = event.detail;
      postStateToBackend(state, immediate || true);
    };
    window.addEventListener("force-save-state", handleForceSave);
    const handleCustomStateChange = (event) => {
      console.log("Custom state change event received:", event.detail);
      if (autoSaveEnabled) {
        const currentState = store.getState();
        postStateToBackend(currentState, true);
      }
    };
    window.addEventListener("redux-state-change", handleCustomStateChange);
    let previousState = JSON.stringify(store.getState(), Object.keys(store.getState()).sort());
    const unsubscribeStateChange = store.subscribe(() => {
      const currentState = store.getState();
      const currentStateString = JSON.stringify(currentState, Object.keys(currentState).sort());
      if (currentStateString !== previousState) {
        console.log("State changed, triggering auto-save");
        previousState = currentStateString;
        if (autoSaveEnabled) {
          postStateToBackend(currentState);
        }
      }
    });
    setRedirectUri(
      "http://localhost:4321/callback"
    );
    const storedUserInfo = localStorage.getItem("authentik_top_banner_authuser_info");
    const accessToken = localStorage.getItem("authentik_top_banner_authaccess_token");
    const idToken = localStorage.getItem("authentik_top_banner_authid_token");
    console.log("Stored User Info:", {
      userInfo: storedUserInfo,
      accessToken,
      idToken
    });
    if (storedUserInfo) {
      try {
        let parsedUserInfo = {};
        try {
          parsedUserInfo = JSON.parse(storedUserInfo);
        } catch (partialParseError) {
          console.warn("Partial or truncated user info, attempting recovery", partialParseError);
          const validJsonMatch = storedUserInfo.match(/^{[^}]*}/);
          if (validJsonMatch) {
            try {
              parsedUserInfo = JSON.parse(validJsonMatch[0]);
            } catch (recoveryError) {
              console.error("Could not recover user info", recoveryError);
              localStorage.removeItem("authentik_top_banner_authuser_info");
              return;
            }
          }
        }
        const decodeJWT = (token) => {
          try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            return JSON.parse(window.atob(base64));
          } catch (error) {
            console.error("Error decoding JWT", error);
            return {};
          }
        };
        const decodedAccessToken = accessToken ? decodeJWT(accessToken) : {};
        const decodedIdToken = idToken ? decodeJWT(idToken) : {};
        const mergedUserInfo = {
          ...decodedAccessToken,
          ...decodedIdToken,
          ...parsedUserInfo,
          access_token: accessToken,
          id_token: idToken
        };
        const loginPayload = {
          isAuthenticated: true,
          sub: mergedUserInfo.sub || null,
          email: mergedUserInfo.email || null,
          email_verified: mergedUserInfo.email_verified || false,
          name: mergedUserInfo.name || null,
          given_name: mergedUserInfo.given_name || null,
          family_name: mergedUserInfo.family_name || null,
          nickname: mergedUserInfo.nickname || null,
          preferred_username: mergedUserInfo.preferred_username || null,
          groups: mergedUserInfo.groups || [],
          picture: mergedUserInfo.picture || null,
          access_token: accessToken,
          id_token: idToken,
          token_type: "Bearer",
          expires_at: mergedUserInfo.exp ? new Date(mergedUserInfo.exp * 1e3).toISOString() : null,
          lastLogin: (/* @__PURE__ */ new Date()).toISOString(),
          theme: "system",
          language: "en"
        };
        console.log("Dispatching Comprehensive Login Payload:", loginPayload);
        store.dispatch(login(loginPayload));
        startTransition(() => {
          setIsAuthenticated(true);
          setUserProfile({
            email: mergedUserInfo.email,
            email_verified: mergedUserInfo.email_verified,
            sub: mergedUserInfo.sub
          });
        });
        console.log("Login processed successfully");
      } catch (error) {
        console.error("Error processing user info:", error);
        localStorage.removeItem("authentik_top_banner_authuser_info");
      }
    }
    setTimeout(() => {
      postStateToBackend(store.getState(), true);
    }, 1e3);
    return () => {
      unsubscribeTheme();
      unsubscribeStateChange();
      unsubscribeUser();
      window.removeEventListener("redux-state-change", handleCustomStateChange);
      window.removeEventListener("force-save-state", handleForceSave);
      if (saveTimeoutRef.current !== null) {
        console.log("Cleaning up save timeout during component unmount");
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [autoSaveEnabled, isAuthenticated, theme]);
  const handleLogin = async () => {
    try {
      setLoading(true);
      const isDev = true;
      if (isDev && false) ;
      const currentPath = window.location.pathname + window.location.search;
      const client = createClient({
        clientId: "SDyvH6sVjZnajkPlyh40jSdWuniXuOERYh1DjLqT",
        clientSecret: "UWD2qQNsJzRlwuiURmNcJWcnPvi2GKhIujhtDrWVLdPoyy8CDmuHcUyywqhdJHEucV1OSfzacrKUXqmLRVM6e2zJhL9H5qpWfvHncgNm9R0KFawzAbJkhb8pLBiLauMI",
        redirectUri: redirectUri || "",
        scopes: "openid profile email",
        baseUrl: "https://auth.pkc.pub",
        storageKey: `${"authentik_"}top_banner_auth`
      });
      await client.login(currentPath);
    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
      {
        console.log("Development mode: Using mock authentication after error");
        const mockUserInfo = {
          email: "dev@example.com",
          email_verified: true,
          sub: "dev-user"
        };
        localStorage.setItem("authentik_top_banner_authuser_info", JSON.stringify(mockUserInfo));
        const loginPayload = {
          profile: {
            ...mockUserInfo,
            name: "Dev User",
            given_name: "Dev",
            family_name: "User",
            nickname: "dev",
            preferred_username: "devuser",
            groups: ["Developers"],
            picture: null
          },
          tokens: {
            access_token: "mock-access-token",
            id_token: "mock-id-token",
            token_type: "Bearer",
            expires_at: new Date(Date.now() + 36e5).toISOString()
            // 1 hour from now
          }
        };
        store.dispatch(login(loginPayload));
        setIsAuthenticated(true);
        setUserProfile({
          email: mockUserInfo.email,
          email_verified: mockUserInfo.email_verified,
          sub: mockUserInfo.sub
        });
      }
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("authentik_top_banner_authuser_info");
    localStorage.removeItem("authentik_top_banner_authaccess_token");
    localStorage.removeItem("authentik_top_banner_authid_token");
    store.dispatch(logout());
    startTransition(() => {
      setIsAuthenticated(false);
      setUserProfile({});
    });
  };
  const handleManualSave = () => {
    postStateToBackend(store.getState(), true);
  };
  const toggleAutoSave = () => {
    setAutoSaveEnabled((prev) => !prev);
  };
  const formatLastSaved = () => {
    if (!lastSaved) return "Never saved";
    const now = /* @__PURE__ */ new Date();
    const diff = now.getTime() - lastSaved.getTime();
    if (diff < 6e4) {
      return "Just now";
    } else if (diff < 36e5) {
      const minutes = Math.floor(diff / 6e4);
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    } else {
      return lastSaved.toLocaleTimeString();
    }
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "w-full h-14 bg-background border-b flex items-center justify-between px-6 shadow-sm", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center space-x-4", children: [
      /* @__PURE__ */ jsxDEV("h1", { className: "text-xl font-semibold text-foreground", children: "Redux Todo App" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
        lineNumber: 523,
        columnNumber: 9
      }, void 0),
      isClient && lastSaved && /* @__PURE__ */ jsxDEV("span", { className: "text-xs text-gray-500", children: [
        "Last saved: ",
        formatLastSaved()
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
        lineNumber: 525,
        columnNumber: 11
      }, void 0)
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
      lineNumber: 522,
      columnNumber: 7
    }, void 0),
    /* @__PURE__ */ jsxDEV("div", { className: "flex items-center space-x-4", children: [
      isClient && isAuthenticated ? /* @__PURE__ */ jsxDEV("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-end", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-medium text-foreground", children: userProfile.email }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
            lineNumber: 534,
            columnNumber: 15
          }, void 0),
          userProfile.email_verified && /* @__PURE__ */ jsxDEV("span", { className: "text-xs text-green-600", children: "Verified" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
            lineNumber: 538,
            columnNumber: 17
          }, void 0)
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
          lineNumber: 533,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: handleLogout,
            className: "text-red-500 hover:text-red-600",
            "aria-label": "Sign Out",
            children: /* @__PURE__ */ jsxDEV(FiLogOut, { className: "w-5 h-5" }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
              lineNumber: 546,
              columnNumber: 15
            }, void 0)
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
            lineNumber: 541,
            columnNumber: 13
          },
          void 0
        )
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
        lineNumber: 532,
        columnNumber: 11
      }, void 0) : isClient ? /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: handleLogin,
          disabled: loading,
          className: `
              flex items-center justify-center px-3 py-1 rounded-full transition-colors text-sm font-medium
              ${loading ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-100 text-blue-600 hover:bg-blue-200"}
            `,
          "aria-label": "Sign In",
          children: loading ? "Signing In..." : "Sign In"
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
          lineNumber: 550,
          columnNumber: 11
        },
        void 0
      ) : null,
      isClient && /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: toggleAutoSave,
              className: `
                  flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium
                  ${autoSaveEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}
                `,
              "aria-label": autoSaveEnabled ? "Auto-save enabled" : "Auto-save disabled",
              title: autoSaveEnabled ? "Click to disable auto-save" : "Click to enable auto-save",
              children: autoSaveEnabled ? "Auto-save ON" : "Auto-save OFF"
            },
            void 0,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
              lineNumber: 567,
              columnNumber: 15
            },
            void 0
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleManualSave,
              disabled: saving,
              className: `
                  flex items-center justify-center w-8 h-8 rounded-full transition-colors
                  ${saving ? "text-gray-400 cursor-not-allowed" : "text-green-600 hover:bg-green-100"}
                `,
              "aria-label": "Force save state",
              title: "Force save current state",
              children: saving ? /* @__PURE__ */ jsxDEV("span", { className: "animate-spin", children: "•" }, void 0, false, {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
                lineNumber: 593,
                columnNumber: 19
              }, void 0) : /* @__PURE__ */ jsxDEV(FiSave, { className: "w-5 h-5" }, void 0, false, {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
                lineNumber: 595,
                columnNumber: 19
              }, void 0)
            },
            void 0,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
              lineNumber: 580,
              columnNumber: 15
            },
            void 0
          )
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
          lineNumber: 566,
          columnNumber: 13
        }, void 0),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => store.dispatch(toggleTheme()),
            className: "text-foreground hover:text-foreground/80",
            "aria-label": "Toggle theme",
            children: theme === "light" ? /* @__PURE__ */ jsxDEV(FiMoon, { className: "w-6 h-6" }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
              lineNumber: 605,
              columnNumber: 17
            }, void 0) : /* @__PURE__ */ jsxDEV(FiSun, { className: "w-6 h-6" }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
              lineNumber: 607,
              columnNumber: 17
            }, void 0)
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
            lineNumber: 599,
            columnNumber: 13
          },
          void 0
        )
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
        lineNumber: 565,
        columnNumber: 11
      }, void 0)
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
      lineNumber: 530,
      columnNumber: 7
    }, void 0)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar.tsx",
    lineNumber: 521,
    columnNumber: 5
  }, void 0);
};

export { TopBar, TopBar as default };
