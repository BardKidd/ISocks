import { useAbility } from '../contexts';
import { Navigate } from 'react-router-dom';

export function withPageAccess(pageName, action = 'read') {
  return function withPageAccessHOC(WrappedComponent) {
    function ProtectedPage(props) {
      const ability = useAbility();

      if (!ability?.can(action, pageName)) {
        return <Navigate to="/unauthorized" />;
      }

      return <WrappedComponent {...props} />;
    }

    ProtectedPage.displayName = `WithPageAccess(${WrappedComponent.name})`;

    return ProtectedPage;
  };
}
