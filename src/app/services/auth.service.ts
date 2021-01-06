import { Injectable } from '@angular/core';
import {AngularFireAuth} from "@angular/fire/auth";
import {AngularFirestore} from "@angular/fire/firestore";
import {Observable, of} from "rxjs";
import {switchMap} from 'rxjs/operators';
import firebase from "firebase";
import firestore = firebase.firestore;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user: Observable<any | undefined>;

  constructor(private afAuth: AngularFireAuth,
              private afs: AngularFirestore) {

    this.user = this.afAuth.authState.pipe(
      switchMap(auth => {
        if (auth) {
          return this.afs.doc<any>(`users/${auth.uid}`).valueChanges();
        } else {
          return of(null);
        }
      })
    );

  }

  createUserDoc(user) {
    return this.afs.doc(`users/${user.uid}`).set({ ...user })
  }

  saveBoard(uid: string, board: any) {
    // return this.afs.doc(`users/${uid}`).update( { board })
    return this.afs.doc(`users/${uid}`).update( { board })
  }

  async logout() {
    await this.afAuth.signOut();
    window.location.reload();
  }

  addToArray(uid:string, fruit: string) {
    return this.afs.doc(`users/${uid}`).update({
      fruits: firestore.FieldValue.arrayUnion(fruit)
    })
  }
  removeFromArray(uid:string, fruit: string) {
    return this.afs.doc(`users/${uid}`).update({
      fruits: firestore.FieldValue.arrayRemove(fruit)
    })
  }

}
