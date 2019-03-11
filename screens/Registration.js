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
  Alert,
  KeyboardAvoidingView,
  AsyncStorage,
} from 'react-native';

import firebase from 'react-native-firebase';


export default class HomeScreen extends React.Component {
  

  constructor(props){
    super(props);
    this.state = {
      username: '',
      password: '',
      confirmPassword: '',
      firstname: '',
      lastname: '',

      usernameError: '',
      passwordError: '',
      confirmPasswordError: '',
      firstnameError: '',
      lastnameError: '',

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
      confirmPasswordError: '',
      firstnameError: '',
      lastnameError: '',
      ...input,
    });
  }
  onSubmit = ()=>{
    this.setState({isLoading: true}, async ()=>{
      let errorLabel = false;
      var users;
      if(this.state.username.length <= 0){
        errorLabel = true;
        this.setState({usernameError: 'This field is required'})
      }
      if(this.state.password.length <= 0){
        errorLabel = true;
        this.setState({passwordError: 'This field is required'})
      }
      if(this.state.confirmPassword.length <= 0){
        errorLabel = true;
        this.setState({confirmPasswordError: 'This field is required'})
      }
      else if(this.state.confirmPassword != this.state.password){
        errorLabel = true;
        this.setState({confirmPasswordError: 'Does not match to Password'})
      }
      if(this.state.firstname.length <= 0){
        errorLabel = true;
        this.setState({firstnameError: 'This field is required'})
      }
      if(this.state.lastname.length <= 0){
        errorLabel = true;
        this.setState({lastnameError: 'This field is required'})
      }
      if(errorLabel) {
        return this.setState({
          isLoading: false,
        })
      }
      try{
        users = await firebase.firestore().collection('users').where('username','==',this.state.username).get();
      }
      catch(e){
        console.log(e.message)
      }
      
      if( users.docs.length ){
        return this.setState({
          isLoading: false,
          usernameError: 'Username is not available'
        })
      }
      console.log("Save session data start");
      let user = {
        username: this.state.username,
        password: this.state.password,
        firstname: this.state.firstname,
        lastname: this.state.lastname,
        type: "customer",
        status: "active",
      }
      try{
        
        let userDoc = await firebase.firestore().collection("users").add(user)
        console.log("userDocId", userDoc.id);
        await AsyncStorage.setItem('user', JSON.stringify({ userDocId: userDoc.id, ...user }) );
        console.log("Save session data end");
        console.log("Redirecting to Auth");
        Alert.alert(
          'Registration Successful',
          'proceed to login?',
          [
            {
              text: 'Cancel',
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
            {text: 'OK', onPress: () => this.props.navigation.navigate('Login')},
          ],
          {cancelable: false},
        );
        
      }
      catch(e){
        console.log("Save session failed", e)
      }
      this.setState({isLoading: false});
    })
  }
  render(){
    return (
      <ScrollView style={{flex: 1}} contentContainerStyle={styles.container}>
        <KeyboardAvoidingView>
        <View style={styles.container}>
        <View style={styles.textInput}>
          <TextInput
            onChangeText={(text) => this.onInputChange({username:text})}
            value={this.state.username}
            placeholder="Username"
          />
        </View>
        
        <Text style={styles.textError}>{this.state.usernameError}</Text>
        <View style={styles.textInput}>
          <TextInput
            onChangeText={(text) => this.onInputChange({password:text})}
            value={this.state.password}
            secureTextEntry={true}
            placeholder="Password"
          />
        </View>
        
        
        <Text style={styles.textError}>{this.state.passwordError}</Text>
        
        <View style={styles.textInput}>
          <TextInput
            onChangeText={(text) => this.onInputChange({confirmPassword:text})}
            value={this.state.confirmPassword}
            secureTextEntry={true}
            placeholder="Confirm Password"
          />
        </View>
        
        <Text style={styles.textError}>{this.state.confirmPasswordError}</Text>
        <View style={styles.textInput}>
          <TextInput
            onChangeText={(text) => this.onInputChange({firstname:text})}
            value={this.state.firstname}
            placeholder="Firstname"
          />
        </View>
        
        <Text style={styles.textError}>{this.state.firstnameError}</Text>
        <View style={styles.textInput}>
          <TextInput
            onChangeText={(text) => this.onInputChange({lastname:text})}
            value={this.state.lastname}
            placeholder="Lastname"
          />
        </View>
        <Text style={styles.textError}>{this.state.lastnameError}</Text>

        <View style={{width: 100, marginBottom: 50}}><Button title="Register" disabled={this.state.isLoading} onPress={this.onSubmit} /></View>
        <View style={{width: 100, marginRight: 200}}><Button title="Login" disabled={this.state.isLoading} onPress={()=>this.props.navigation.navigate('Login')} /></View>
      </View>
      </KeyboardAvoidingView>
      </ScrollView>
    )
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
    borderColor:'grey',
    width:300,
    borderWidth: 1,
    borderStyle: 'solid',
    fontSize:15,
    borderRadius: 25,
    padding: 10,
    paddingLeft: 20,
    paddingRight: 20,
    elevation: 3,
  },
  textError: {
    color: "red",
    paddingTop: 5, 
    paddingBottom: 10
  }
});
