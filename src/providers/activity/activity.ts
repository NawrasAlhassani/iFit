// Angular
import { Injectable } from '@angular/core';

// Ionic
import { Storage } from '@ionic/storage';

// Firebase
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';

// Third-party
import * as moment from 'moment';

// Models
import { Activity, ActivityPlan } from '../../models';

const CURRENT_DAY: number = moment().dayOfYear();

@Injectable()
export class ActivityProvider {
  constructor(
    private _db: AngularFireDatabase,
    private _storage: Storage
  ) { }

  public calculateActivityEnergyConsumption(activity: Activity): Promise<number> {
    return new Promise((resolve, reject) => {
      this._storage.ready().then((storage: LocalForage) => {
        this._storage.get('weight')
          .then((weight: number) => {
            resolve(Math.round((activity.met * 3.5 * weight / 200) * activity.duration))
          }).catch((err: Error) => console.error(`Error getting user nutrition requirements: ${err}`));
      }).catch((err: Error) => console.error(`Error loading storage: ${err}`));
    });
  }

  public calculateActivityPlanDuration(activities: Activity[]): number {
    return activities.reduce((acc: number, currActivity: Activity) => acc += currActivity.duration, 0);
  }

  public calculateActivityPlanEnergyConsumption(activities: Activity[]): number {
    return activities.reduce((acc: number, currActivity: Activity) => acc += currActivity.energyConsumption, 0);
  }

  public getActivities$(): FirebaseListObservable<Activity[]> {
    return this._db.list('/activities');
  }

  public getActivityPlan$(authId: string): FirebaseObjectObservable<ActivityPlan> {
    return this._db.object(`/activity-plan/${authId}/${CURRENT_DAY}`);
  }

  public saveActivityPlan(authId: string, activityPlan: ActivityPlan): firebase.Promise<void> {
    this._storage.ready().then(() => {
      this._storage.set(`energyConsumption-${CURRENT_DAY}`, activityPlan.totalEnergyConsumption)
        .catch((err: Error) => console.error(`Error storing energy consumption: ${err}`));
    }).catch((err: Error) => console.error(`Error loading storage: ${err}`));
    return this._db.object(`/activity-plan/${authId}/${CURRENT_DAY}`).set(activityPlan);
  }
}
