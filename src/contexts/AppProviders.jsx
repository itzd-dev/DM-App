import { UiProvider } from './ui/UiContext';
import { AuthProvider } from './auth/AuthContext';
import { UserProvider } from './user/UserContext';
import { CatalogProvider } from './catalog/CatalogContext';
import { PromotionProvider } from './promotions/PromotionContext';
import { PartnerProvider } from './partners/PartnerContext';
import { NavigationProvider } from './navigation/NavigationContext';
import { CartProvider } from './cart/CartContext';
import { OrdersProvider } from './orders/OrdersContext';

export const AppProviders = ({ children }) => (
  <UiProvider>
    <AuthProvider>
      <UserProvider>
        <CatalogProvider>
          <PromotionProvider>
            <PartnerProvider>
              <NavigationProvider>
                <CartProvider>
                  <OrdersProvider>{children}</OrdersProvider>
                </CartProvider>
              </NavigationProvider>
            </PartnerProvider>
          </PromotionProvider>
        </CatalogProvider>
      </UserProvider>
    </AuthProvider>
  </UiProvider>
);
