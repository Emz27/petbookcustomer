import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon';

import Transaction from '../screens/Transaction'
import StreamService from '../screens/StreamService'
import Browse from '../screens/Browse'
import ServiceDetail from '../screens/ServiceDetail'
import Book from '../screens/Book'



const TransactionStack = createStackNavigator({
  Transaction: Transaction,
  StreamService: StreamService,
});

TransactionStack.navigationOptions = {
  tabBarLabel: 'Transactions',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={'md-paper'}
    />
  ),
};

const BrowseStack = createStackNavigator({
  Browse: Browse,
  ServiceDetail: ServiceDetail,
  Book: Book,
});

BrowseStack.navigationOptions = {
  tabBarLabel: 'Browse',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={'md-search'}
    />
  ),
};



export default createBottomTabNavigator({
  BrowseStack,
  TransactionStack,
});
