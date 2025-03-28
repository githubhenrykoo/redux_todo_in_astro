import { c as createComponent, a as createAstro, d as renderComponent, r as renderTemplate, m as maybeRenderHead, g as addAttribute } from '../chunks/astro/server_cUnz5K5q.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DpAEEdhg.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$AuthExample = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AuthExample;
  const canonicalURL = Astro2.url;
  const baseUrl = `${canonicalURL.protocol}//${canonicalURL.host}`;
  return renderTemplate`${renderComponent($$result, "Layout", $$BaseLayout, { "title": "Authentik Authentication Example" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container mx-auto max-w-4xl py-8 px-4"> <h1 class="text-3xl font-bold mb-6">Authentik Authentication</h1> <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"> <p class="text-blue-800"> <strong>Note:</strong> This authentication system is completely isolated to this page only. 
        It won't affect any other pages or components in the application.
</p> </div> <div class="mb-8"> <h2 class="text-xl font-semibold mb-3">Authentication Status</h2> <div class="p-4 border rounded-lg bg-gray-50"> ${renderComponent($$result2, "AuthentikPanel", null, { "client:only": true, "config": {
    clientId: undefined                                   ,
    redirectUri: `${baseUrl}/callback`,
    scopes: undefined                                ,
    baseUrl: undefined                             ,
    storageKey: `${"authentik_"}auth_example_page`
  }, "client:component-hydration": "only", "client:component-path": "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/auth/AuthentikPanel", "client:component-export": "default" })} <div class="mt-4 text-sm text-gray-600"> <p> <strong>Current Authentication Server:</strong> <a${addAttribute(undefined                             , "href")} target="_blank" class="text-blue-600 hover:underline"> ${undefined                             } </a> </p> <p class="mt-2"> <strong>Authentication Scope:</strong> ${undefined                                } </p> </div> </div> </div> <div class="mb-8"> <h2 class="text-xl font-semibold mb-3">How It Works</h2> <div class="prose"> <p>This example demonstrates authentication using Authentik, a powerful identity provider available at <a${addAttribute(undefined                             , "href")} target="_blank">auth.pkc.pub</a>.</p> <p>The authentication flow uses the OAuth 2.0 Authorization Code flow with PKCE (Proof Key for Code Exchange) for enhanced security.</p> <h3>Authentication Flow:</h3> <ol> <li>User clicks "Sign in with Authentik"</li> <li>User is redirected to the Authentik login page</li> <li>After successful authentication, Authentik redirects back with an authorization code</li> <li>The component exchanges the code for access and refresh tokens</li> <li>User information is fetched using the access token</li> <li>The user is now authenticated in the application</li> </ol> </div> </div> <div class="mb-8"> <h2 class="text-xl font-semibold mb-3">Isolation Features</h2> <div class="prose"> <p>This authentication implementation has several features to ensure it remains isolated:</p> <ul> <li><strong>Page-specific authentication</strong> - Auth state only exists on this page</li> <li><strong>Unique storage keys</strong> - Prevents conflicts with other parts of the app</li> <li><strong>No global state</strong> - Doesn't use Redux or any global state management</li> <li><strong>No side effects</strong> - Won't affect other pages or components</li> <li><strong>Opt-in only</strong> - Authentication only happens where you explicitly add the component</li> </ul> </div> </div> <div class="mb-8"> <h2 class="text-xl font-semibold mb-3">Configuration</h2> <div class="prose"> <p>To use this authentication panel in your application, you need to:</p> <ol> <li>Register your application in Authentik and obtain a client ID</li> <li>Set up environment variables in a <code>.env</code> file:</li> </ol> <pre><code>AUTHENTIK_CLIENT_ID=your-client-id-here
AUTHENTIK_SCOPES=openid profile email
AUTHENTIK_URL=https://auth.pkc.pub
AUTHENTIK_STORAGE_KEY_PREFIX=authentik_panel_</code></pre> <p>You can then include the component in your Astro pages:</p> <pre><code>&lt;AuthentikPanel 
  client:only=${true}
  config=${{
    clientId: undefined                                   ,
    redirectUri: `${Astro2.url.protocol}//${Astro2.url.host}/your-page`,
    scopes: undefined                                ,
    baseUrl: undefined                             ,
    storageKey: `${undefined                                            }your_page`
  }}
/&gt;</code></pre> </div> </div> </div> ` })}`;
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/auth-example.astro", void 0);
const $$file = "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/auth-example.astro";
const $$url = "/auth-example";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$AuthExample,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
