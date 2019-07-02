import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  View,
  Button,
  Picker,
} from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';

import posed from 'react-native-pose';
import firebase from 'react-native-firebase';
import moment from 'moment'
import DatePicker from 'react-native-datepicker'

export default class Book extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "Book for " + navigation.getParam('service', {serviceName: ""}).serviceName,
    };
  };
  constructor(props){
    super(props);
    let service = this.props.navigation.getParam("service");
    this.state = {
      address: "",
      service: service,
      groomers: [],
      usedSlots: [],
      availableSlots: [],
      reservations: [],
      date: moment().format("MM/DD/YYYY"),
      timeSlotIndex: "",
      message: "",
    }
    this.timeSlots = ["8:00 am","8:30 am","9:00 am","9:30 am","10:00 am","10:30 am","11:00 am","11:30 am",
    "12:00 pm","12:30 pm","1:00 pm","1:30 pm","2:00 pm","2:30 pm","3:00 pm","3:30 pm","4:00 pm","4:30 pm","5:00 pm","5:30 pm",
    "6:00 pm","6:30 pm","7:00 pm","7:30 pm","8:00 pm","8:30 pm","9:00 pm","9:30 pm","10:00 pm","10:30 pm","11:00 pm",];

    this.serviceListener = ()=>{};
    this.reservationListener = ()=>{};
    this.groomerListener = ()=>{};


    this.loadService();
    this.loadGroomers();
    this.loadReservations();
  }
  componentWillUnmount(){
    this.serviceListener();
    this.reservationListener();
    this.groomerListener();
  }
  loadService(){
    this.serviceListener = firebase.firestore().collection("services").doc(this.props.navigation.getParam('service').serviceDocId)
    .onSnapshot((snapShot)=>{
      console.log("service updated!");
      if(snapShot.doc){
        let data = snapShot.doc.data();
        let id = snapShot.doc.id
        this.setState({
          service: {...data, serviceDocId: id, key: id},
        })
      }
    })
  }
  async loadGroomers(){
    this.groomerListener = await firebase.firestore().collection("users").where("type", "==", "groomer")
    .onSnapshot(snapshot=>{
      console.log("total no of groomers: "+snapshot.docs.length);
      if(snapshot.docs.length){
        let groomers = [];
        for(let doc of snapshot.docs){
          let data = doc.data();
          let id = doc.id;  
          if(data.status == "active" && data.petshopDocId == this.state.service.petshopDocId){
            groomers.push({
              groomerDocId: id,
              ...data,
            });
          }
        }
        console.log("groomers: ", groomers)
        console.log("no of groomers today: "+groomers.length);
        this.setState({groomers})
      }
    })
  }
  async loadReservations(){
    this.reservationListener();
    this.reservationListener = firebase.firestore().collection("reservations").where("petshopDocId", "==", this.state.service.petshopDocId)
    .onSnapshot(snapshot=>{
      if(snapshot.docs.length){
        let reservations = [];
        for(let doc of snapshot.docs){
          let data = doc.data();
          let id = doc.id;
          reservations.push({
            reservationDocId: id,
            ...data,
            dateTimeStart: moment(data.dateTimeStart.toDate()),
            dateTimeEnd: moment(data.dateTimeEnd.toDate()),
            dateTime: moment(data.dateTime.toDate()),
          });
          
        }
        reservations.sort(function(a,b){
          return b.dateTimeStart.toDate() - a.dateTimeStart.toDate();
        });
        console.log(reservations);
        this.setState({
          reservations
        }, async ()=>{
          this.getAvailableSlots(this.state.date);
        });
      }
    });
  }
  async getAvailableSlots(date){
    
    let groomers = [...this.state.groomers];
    let reservations = [...this.state.reservations];
    
    let usedSlots = this.state.reservations.filter(item=>{
      if(item.dateTimeStart.isSame(moment(date, "MM/DD/YYYY"), 'day') && item.dateTimeStart.isSameOrAfter(moment()) && item.status != "cancelled"){
        try{
          let groomer = groomers.find(gm=>gm.groomerDocId == item.groomerDocId);
          if(groomer){
            let workCount = groomer.workCount;
            if(workCount){
              groomer.workCount + 1;
            }
            else groomer.workCount = 1;
          }
        }catch(e){console.error(e.message)}

        return true;
      }
      else return false;
    });
    let availableSlots = this.timeSlots.map((slot)=>{
      return {
        timeSlot: slot,
        dateTimeSlot: moment(moment(date, "MM/DD/YYYY").format("MM/DD/YYYY ") + slot, "MM/DD/YYYY h:mm a"),
        slots: groomers.length,
        groomers: [...groomers],
      }
    })
    availableSlots = availableSlots.filter((slot, index)=>{
      let startIndex = index;
      let endIndex = index + (this.state.service.duration/30);

      if( endIndex < availableSlots.length){
        for(let s of usedSlots){
          if(s.status != "cancelled" && (availableSlots[startIndex].dateTimeSlot.isBetween(s.dateTimeStart, s.dateTimeEnd, null, '[]') || availableSlots[endIndex].dateTimeSlot.isBetween(s.dateTimeStart, s.dateTimeEnd, null, '[]'))){
            let groomerIndex = slot.groomers.findIndex(sg=>sg.groomerDocId == s.groomerDocId);
            if(groomerIndex != -1){ 
              slot.groomers.splice(groomerIndex, 1);
            }
          }
        }
        if(slot.groomers.length){
          return true;
        } 
        else return false;
      }
      else return false;
    })
    availableSlots = availableSlots.filter((slot, index)=>slot.dateTimeSlot.isSame(moment(date, "MM/DD/YYYY"),'day') && slot.dateTimeSlot.isSameOrAfter(moment()));
    
    this.setState({usedSlots, availableSlots})
  }
  changeDate(date){
    this.getAvailableSlots(date);
    this.setState({
      date: moment(date, "MM/DD/YYYY").format("MM/DD/YYYY")
    })
  }
  async onSubmit(){
    Alert.alert(
      '',
      'Are you sure you want to book for this service?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {text: 'Yes', onPress: () => {
          this.setState({isLoading: true}, async ()=>{
            this.user = JSON.parse(await AsyncStorage.getItem("user"));
            try{
              let service = this.props.navigation.getParam("service");
              let availableGroomers = [...this.state.availableSlots[+this.state.timeSlotIndex].groomers]
              let dateTimeStart = moment(this.state.availableSlots[+this.state.timeSlotIndex].dateTimeSlot);
              let dateTimeEnd = moment(dateTimeStart).add( +this.state.service.duration,"m");

              let dateTimeStartConflict = await firebase.firestore().collection("reservations")
              .where("dateTimeStart", ">", dateTimeStart.toDate())
              .where("dateTimeStart", "<", dateTimeEnd.toDate()).get();

              let dateTimeEndConflict = await firebase.firestore().collection("reservations")
              .where("dateTimeEnd", ">", dateTimeStart.toDate())
              .where("dateTimeEnd", "<", dateTimeEnd.toDate()).get()

              if( dateTimeStartConflict.docs.length > 0){
                dateTimeStartConflict.docs.forEach((doc)=>{
                  availableGroomers = availableGroomers.filter(g=>g.groomerDocId != doc.data().groomerDocId)
                });
              }
              if( dateTimeEndConflict.docs.length > 0 ){
                dateTimeEndConflict.docs.forEach((doc)=>{
                  availableGroomers = availableGroomers.filter(g=>g.groomerDocId != doc.data().groomerDocId)
                });
              }

              if(availableGroomers.length == 0){
                console.log("no available groomers!");
                return false;
              }

              availableGroomers.sort((a,b)=>b.workCount - a.workCount);

              let user = JSON.parse(await AsyncStorage.getItem("user"));

              let reserve = await firebase.firestore().collection("reservations").add({
                status: "pending",
                reason: "",
                message: this.state.message,
                petshopDocId: service.petshopDocId,
                petshopName: service.petshopName,
                dateTimeStart: dateTimeStart.toDate(),
                dateTimeEnd: dateTimeEnd.toDate(),
                dateTime: moment().toDate(),
                serviceDocId: service.serviceDocId,
                serviceName: service.serviceName,
                servicePetTypes: service.petTypes,
                minPrice: service.minPrice,
                maxPrice: service.maxPrice,
                duration: service.duration,
                details: service.details,
                customerDocId: user.userDocId,
                customerFirstname: user.firstname,
                customerLastname: user.lastname,
                groomerDocId: availableGroomers[0].groomerDocId,
                groomerFirstname: availableGroomers[0].firstname,
                groomerLastname: availableGroomers[0].lastname,
              });
              Alert.alert(
                'Request Sent!',
                'Go to "Transactions" tab to view the status of the request',
                [
                  {text: 'Ok', onPress: () => {
                    this.props.navigation.navigate("Transaction");
                  }},
                ],
                {cancelable: true},
              );
            }
            catch(e){ console.log(e.message)}
            this.setState({
              isLoading: false,
            })
          })
          
        }},
      ],
      {cancelable: false},
    );
  }
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Price: </Text>
          <Text>P{this.state.service.minPrice} - P{this.state.service.maxPrice}</Text>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Duration: </Text>
          <Text>
            {(()=>{
              let time = "";
              if(this.state.service.duration >= 60){
                time += Math.floor(this.state.service.duration / 60) + " hour ";
                if((this.state.service.duration % 60) > 0) time += this.state.service.duration % 60 + " minutes"
              }
              return time;
            })()}
          </Text>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date</Text>
          <DatePicker
            style={{width: 200}}
            date={this.state.date}
            mode="date"
            placeholder="select Date"
            format="MM/DD/YYYY"
            minDate={moment().toDate()}
            maxDate={moment().add(7, "days").toDate()}
            is24Hour={false}
            confirmBtnText="Confirm"
            cancelBtnText="Cancel"
            customStyles={{
              dateIcon: {
                position: 'absolute',
                left: 0,
                top: 4,
                marginLeft: 0 
              },
              dateInput: {
                marginLeft: 36,
                borderWidth: 0,
                borderBottomWidth: 1,
              }
            }}
            onDateChange={(date) => {
              this.changeDate(date);
            }}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Time Slot</Text>
          <Picker
            selectedValue={this.state.timeSlotIndex}
            style={{height: 50, width: 100}}
            onValueChange={(itemValue, itemIndex) =>{
              this.setState({timeSlotIndex: itemValue})
            }}>

            <Picker.Item label="Select Time Slot" value={this.state.timeSlotIndex} />
            {this.state.availableSlots.map((slot, index)=>
              <Picker.Item key={slot.timeSlot + moment().toDate()} label={`${slot.timeSlot} ${(slot.groomers.length>1)?"- slots: "+slot.groomers.length:""}`} value={index} />
            )}
          </Picker>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Message</Text>
          <View style={styles.textInput}>
            <TextInput
              multiline = {true}
              numberOfLines = {5}
              onChangeText={(text) => this.setState({message: text})}
              value={this.state.message}
              editable = {true}
              maxLength = {40}
              placeholder="..."
            />
          </View>
        </View>
        <View style={{marginTop: "auto"}}>
          <Button onPress={()=>this.onSubmit()} title="Submit" />
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  input: {

  },
  label: {
    fontWeight: "bold",
    marginRight: 20,
  },
  errorLabel:{

  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  textInput: {
    flex: 1,
    borderColor:'grey',
    borderBottomWidth: 1,
    borderStyle: 'solid',
    fontSize:15,
    borderRadius: 25,
    padding: 10,
    paddingLeft: 20,
    paddingRight: 20,
  },
});
