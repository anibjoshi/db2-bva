import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  Content,
  Theme,
} from '@carbon/react';
import { UserAvatar, Notification } from '@carbon/icons-react';
import { BvaForm } from './components/BvaForm';
import './App.css';

export default function App() {
  return (
    <Theme theme="g10">
      <Header aria-label="IBM Db2 Genius Hub">
        <HeaderName href="/" prefix="IBM">
          Db2 Genius Hub
        </HeaderName>
        <HeaderGlobalBar>
          <HeaderGlobalAction aria-label="Notifications" tooltipAlignment="end">
            <Notification size={20} />
          </HeaderGlobalAction>
          <HeaderGlobalAction aria-label="User" tooltipAlignment="end">
            <UserAvatar size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>
      <Content id="main-content">
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0.5rem 2rem 2rem',
        }}>
          <BvaForm />
        </div>
      </Content>
    </Theme>
  );
}
