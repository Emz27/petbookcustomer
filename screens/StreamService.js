import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Button,
} from 'react-native';

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices
} from 'react-native-webrtc';

import posed from 'react-native-pose';
import firebase from 'react-native-firebase';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default class StreamService extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.getParam('transaction', {serviceName: ""}).serviceName,
    };
  };
  constructor(props){
    super(props);
    this.state = {
      transaction: this.props.navigation.getParam('transaction'),
      stream: null,
    }
    this.connectionListener = ()=>{};
    this.connectionRef = {};
    console.log("Entered Stream Service Screen")
  }
  componentDidMount(){
    this.createConnection();
  }
  componentWillUnmount(){
    this.connectionListener();
  }
  async resetConnection(){
    try{
      this.peerConnection.close();
      this.setState({stream: null})
    }
    catch(e){console.error(e )}
  }
  async createConnection(){
    let configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
    let iceCandidates = [];
    let transaction = this.state.transaction;

    let connections = await firebase.firestore().collection("reservations").doc(transaction.transactionDocId).collection("connections")
    .where("isAvailable", "==", true)
    .get();
    if(connections.docs.length <= 0){
      console.error("This Service is not available for streaming");
      return false;
    }
    this.connectionRef = firebase.firestore().doc("reservations/"+transaction.transactionDocId)
    .collection("connections").doc(connections.docs[0].id)

    try{
      await this.connectionRef.update({isAvailable: false});
    }
    catch(e){
      console.error(e)
      return false;
    }
    let data = connections.docs[0].data();
    let connection = {
      ...data,
      connectionDocId: connections.docs[0].id,
    }
    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.addEventListener('iceconnectionstatechange', async (event)=>{
      console.log("onIceStateChange: ", event.target.iceConnectionState);
      if(event.target.iceConnectionState === "closed" || event.target.iceConnectionState === "disconnected"){
        
      }
      if(event.target.iceConnectionState === "connected"){
        this.iceCandidateListener();
      }
      else if(event.target.iceConnectionState === "failed"){
        // this.resetConnection();
        // this.createConnection();
      }
    });
    this.peerConnection.addEventListener('icecandidate', async (event)=>{
      try{
        if(event.candidate == null || event.candidate === "") iceCandidates.push(null);
        else{
          // let candidate = new RTCIceCandidate(event.candidate);
          let ice = event.candidate.toJSON();
          iceCandidates.push(ice);
          this.connectionRef.collection("remoteIceCandidates").add({
            ice: ice,
            status: "sent",
          })
        } 
        if(event.candidate == null || event.candidate === ""){
          await this.connectionRef.update({
            remoteIceCandidateStatus: "sent",
          });
          console.log("iceCandidate sent: "+ connection.connectionDocId);
          iceCandidates = [];
        }
      }
      catch(e){ console.error(e )}
    });
    this.peerConnection.onaddstream = (event)=>{
      console.log('onaddstream', event.stream);
      console.log(event.stream.toURL());
      this.setState({ stream: event.stream})
    };
    this.peerConnection.onremovestream = (event)=>{
      console.log('onremovestream', event.stream);
    };
    this.connectionListener = this.connectionRef.onSnapshot(async (doc)=>{
      var data = doc.data();
      if(data.localDescriptionStatus == "sent"){
        try{
          console.log(data.localDescription);
          let desc = new RTCSessionDescription(data.localDescription);
          console.log("created sessionDesciption", desc);
          console.log("test");

          console.log(await this.peerConnection.setRemoteDescription(desc));
          let answer = await this.peerConnection.createAnswer();
          console.log("created answer", answer);
          await this.peerConnection.setLocalDescription(answer);
          await this.connectionRef.update({
            remoteDescription: answer.toJSON(),
            remoteDescriptionStatus: "sent",
            localDescriptionStatus: "received",
          })
          this.iceCandidateListener = this.connectionRef.collection("localIceCandidates")
            .where("status", "==", "sent")
            .onSnapshot(async (snapshot)=>{
              try{
                let batch = firebase.firestore().batch();
                for(let doc of snapshot.docs){
                  let ice = doc.data().ice;
                  let status = doc.data().status;
                  console.log(ice)
                  await this.peerConnection.addIceCandidate(new RTCIceCandidate(ice));
                  batch.update( this.connectionRef.collection("localIceCandidates").doc(doc.id), {status: "received"})
                }
                batch.commit();
              }
              catch(e){console.error(e )}
            })
        }
        catch(e){console.error(e )}
      }
    })

  }
  render() {
    return (
      <View style={styles.container}>
        {
          (this.state.stream)
          ? <RTCView style={{flex: 1}} streamURL={this.state.stream.toURL()}/>
          :null
        }
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 25,
  },
  label: {
    fontWeight: "bold",
  }
});
