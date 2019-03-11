import React from 'react';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';

import MainTabNavigator from './MainTabNavigator';
import Authentication from '../screens/Authentication';
import Login from '../screens/Login';
import Registration from '../screens/Registration';

export default createAppContainer(createSwitchNavigator({
  Main: MainTabNavigator,
  Auth: Authentication,
  Login: Login,
  Register: Registration,
},
{
  initialRouteName: 'Auth',
}
));
