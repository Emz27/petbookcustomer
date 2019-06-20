import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Button,
} from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';

import firebase from 'react-native-firebase';

import Icon from 'react-native-vector-icons/AntDesign';
const UserIcon = <Icon name="user" size={30} color="gray" />;
const PasswordIcon = <Icon name="lock" size={30} color="gray" />;


export default class HomeScreen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      username: '',
      password: '',
      usernameError: '',
      passwordError: '',
      isLoading: false,
    }
  }
  static navigationOptions = {
    header: null,
  };
  onInputChange = (input)=>{
    this.setState({
      usernameError: '',
      passwordError: '',
      ...input,
    });
  }
  onSubmit = async ()=>{

    this.setState({ isLoading: true, }, async ()=>{
      let errorLabel = false;
    if(this.state.username.length <= 0){
      errorLabel = true;
      this.setState({usernameError: 'This field is required'})
    }
    if(this.state.password.length <= 0){
      errorLabel = true;
      this.setState({passwordError: 'This field is required'})
    }
    if(errorLabel) {
      return false;
    }
    try{
      var Users = await firebase.firestore().collection('users').where('username','==',this.state.username).get();
    }
    catch(e){
      console.log(e.message);
      return this.setState({
        isLoading: false,
        usernameError: e.message
      })
    }
    
    if( Users.docs.length ){
      if(Users.docs[0].data().type == "groomer" ){
        return this.setState({
          isLoading: false,
          usernameError: 'Account Restricted'
        })
      }
      else if(Users.docs[0].data().type == "owner" ){
        return this.setState({
          isLoading: false,
          usernameError: 'Account Restricted'
        })
      }
    }
    if( !Users.docs.length ){
      return this.setState({
        isLoading: false,
        usernameError: 'User doesnt exist'
      })
    }
    else if( Users.docs[0].data().password != this.state.password){
      return this.setState({
        isLoading: false,
        passwordError: 'Invalid Username and Password',
      })
    }
    console.log("Save session data start");
    try{
      await AsyncStorage.setItem('user', JSON.stringify({ userDocId: Users.docs[0].id, ...Users.docs[0].data() }) );
    }
    catch(e){
      console.log("Save session failed", e)
    }
    console.log("Save session data end");
    console.log("Redirecting to Auth")
    this.props.navigation.navigate('Auth');
    })
  }
  render(){
    return (
     
      <ScrollView style={{flex: 1}} contentContainerStyle={styles.container}>

        <View style={styles.textInput}> 
       {UserIcon} 
           <TextInput
            // style={{
            //   height: 40, width: 120, borderColor: 'gray', borderWidth: 1, textAlign: 'center',
            // }}
            onChangeText={(text) => this.onInputChange({username:text})}
            value={this.state.username}
            placeholder="Username"
           
            
          />
        </View>
        <Text style={{color: "red", paddingTop: 5, paddingBottom: 10}}>{this.state.usernameError}</Text>
        <View style={styles.textInput}> 
        {PasswordIcon}
          <TextInput
            // style={{
            //   height: 40, width: 120, borderColor: 'gray', borderWidth: 1, textAlign: 'center',
            // }}
            onChangeText={(text) => this.onInputChange({password:text})}
            value={this.state.password}
            secureTextEntry={true}
            placeholder="Password"
          />
        </View>
        
        
        <Text style={{color: "red", paddingTop: 5, paddingBottom: 10}}>{this.state.passwordError}</Text>
        
        <View style={{width: 100, marginBottom: 50}}><Button title="Login" disabled={this.state.isLoading} onPress={this.onSubmit} /></View>
        <View style={{width: 100, marginLeft: 200}}><Button title="Register" onPress={()=>this.props.navigation.navigate('Register')} /></View>
      </ScrollView>
    );
  }
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  textInput: {
    flexDirection: "row",
    borderColor:'grey',
    width:250,
    borderWidth: 1,
    borderStyle: 'solid',
    fontSize:15,
    borderRadius: 25,
    padding: 10,
    paddingLeft: 20,
    paddingRight: 20,
    elevation: 3,
  
  },
});
